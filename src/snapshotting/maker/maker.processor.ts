import * as Currencies from 'tf2-currencies-lite';
import axios from 'axios';
import {
    stringify,
    parseSKU,
    parseString,
    toSKU,
} from 'tf2-item-format/static';
import { requireStatic, SchemaEnum } from 'tf2-static-schema';

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import {
    SearchListingResponse,
    SellListing,
    BuyListing,
} from 'src/common/types/bptf';
import { SnapshotNamespace } from 'src/common/namespaces';
import { fillCurrency } from 'src/lib/currency';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnapshotDocument } from 'src/schemas/snapshot.schema';
import { ListingDocument } from 'src/schemas/listing.schema';
import { Job } from 'bull';
import SPELLS from 'src/lib/spells';
import PAINTS from 'src/lib/paints';
import { SnapshotsGateway } from 'src/index/snapshots/snapshots.gateway';
import { getImageFromSKU } from 'src/lib/images';
import { UserDocument } from 'src/schemas/users.schema';
import { promiseDelay } from 'src/lib/helpers';
import { KeyPricesService } from '../keyprices.service';

@Processor('maker')
export class MakerProcessor {
    private readonly logger = new Logger(MakerProcessor.name);

    private readonly parts: SchemaEnum = requireStatic('parts') as SchemaEnum;

    constructor(
        @InjectModel('snapshots')
        private snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings') private listingsModel: Model<ListingDocument>,
        @InjectModel('users') private usersModel: Model<UserDocument>,
        private snapshotsGateway: SnapshotsGateway,
        private keyPricesService: KeyPricesService
    ) {}

    @Process('snapshot')
    async handleSnapshot(
        job: Job<{ defindex: string | number }>
    ): Promise<void> {
        if (!this.keyPricesService.getKeyPrice()) {
            this.logger.warn('No key price yet!');
            throw new Error('No key price!');
        }

        await this.generateSnapshots(job.data.defindex).catch((err) => {
            console.log(err);
        });
    }

    private async getAllListings(
        defindex: string | number,
        quality: number = 0,
        previousResult: (BuyListing | SellListing)[] = [],
        page = 1
    ): Promise<(BuyListing | SellListing)[]> {
        const start = new Date().getTime();

        const { data } = (await axios({
            method: 'GET',
            url: 'https://backpack.tf/api/classifieds/search/v1',
            params: {
                page,
                item: stringify(parseSKU(defindex + ';6')),
                tradable: 1,
                key: process.env.BPTF_API_KEY,
                fold: 0,
                page_size: 30,
                quality,
            },
            timeout: 10 * 1000,
        })) as { data: SearchListingResponse };

        const end = new Date().getTime();

        const qualitySkips = {
            1: 3,
            11: 13,
        };

        const shouldPaginateAgain =
            data.sell.listings.length >= 30 || data.buy.listings.length >= 30;

        // @ts-ignore
        const result = data.sell.listings.concat(data.buy.listings);

        if (shouldPaginateAgain) {
            await promiseDelay(1100 - (end - start));

            return this.getAllListings(
                defindex,
                quality,
                previousResult.concat(result),
                page + 1
            );
        }

        if (quality == 15) return previousResult.concat(result || []);

        if (quality !== 15) {
            page = 0;

            await promiseDelay(1100 - (end - start));

            if (qualitySkips[quality]) quality = qualitySkips[quality];
            else quality++;

            return this.getAllListings(
                defindex,
                quality,
                previousResult.concat(result),
                page + 1
            );
        }
    }

    private async generateSnapshots(defindex: string | number): Promise<void> {
        const listings = await this.getAllListings(defindex);
        const time = this.getUnix();
        const keyPrice = this.keyPricesService.getKeyPrice();

        const snapshots: {
            [sku: string]: SnapshotNamespace.Listing[];
        } = {};

        const steamIDS: string[] = [];

        for (let i = 0; i < listings.length; i++) {
            const listing = listings[i];

            const sku = toSKU(parseString(listing.item.name, true, true));

            const parsed = this.parseListing(listing);

            if (!steamIDS.includes(listing.steamid))
                steamIDS.push(listing.steamid);

            const snapshotListing = {
                buying: listing.intent === 0,
                automatic: listing.automatic === 1,
                listingID: listing.id,
                paint: parsed.paint,
                spells: parsed.spells,
                parts: parsed.parts,
                currencies: fillCurrency(listing.currencies),
                bumped: listing.bump,
                created: listing.created,
                steamID64: listing.steamid,
            };

            if (!snapshots[sku]) snapshots[sku] = [];
            snapshots[sku].push(snapshotListing);
        }

        for (const sku in snapshots) {
            const listings = snapshots[sku];

            // Descending
            const buyListings = listings
                .filter((listing) => listing.buying)
                .sort((a, b) => {
                    return (
                        new Currencies(b.currencies).toValue(keyPrice.metal) -
                        new Currencies(a.currencies).toValue(keyPrice.metal)
                    );
                });
            // Ascending
            const sellListings = listings
                .filter((listing) => !listing.buying)
                .sort((a, b) => {
                    return (
                        new Currencies(a.currencies).toValue(keyPrice.metal) -
                        new Currencies(b.currencies).toValue(keyPrice.metal)
                    );
                });

            snapshots[sku] = buyListings.concat(sellListings);
        }

        for (const sku in snapshots) {
            const ids: string[] = [];

            let buyListings = 0;

            for (let i = 0; i < snapshots[sku].length; i++) {
                const listing = snapshots[sku][i];
                const has = await this.listingsModel
                    .findOne({
                        'listing.listingID': listing.listingID,
                    })
                    .lean();

                if (listing.buying) buyListings++;

                if (!has) {
                    const doc = await new this.listingsModel({
                        sku,
                        listing,
                        savedAt: time,
                        lastSeen: time,
                    }).save();

                    ids.push(doc._id);
                } else {
                    await this.listingsModel.updateOne(
                        {
                            'listing.listingID': listing.listingID,
                        },
                        {
                            listing: listing,
                            lastSeen: time,
                        }
                    );

                    ids.push(has._id);
                }
            }

            const doc = await new this.snapshotsModel({
                sku,
                listings: ids,
                savedAt: time,
            }).save();

            this.snapshotsGateway.emitMessage('snapshot', {
                listings: {
                    buy: buyListings,
                    sell: snapshots[sku].length - buyListings,
                },
                sku,
                name: stringify(parseSKU(sku)),
                id: doc._id,
                image: getImageFromSKU(sku),
            });

            this.logger.debug(`Saved ${sku}!`);
        }

        await this.saveManyUsers(steamIDS);
    }

    private async saveManyUsers(steamIDS: string[]): Promise<void> {
        const chunks = steamIDS.reduce((resultArray, item, index) => {
            const chunkIndex = Math.floor(index / 100);

            if (!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = []; // start a new chunk
            }

            resultArray[chunkIndex].push(item);

            return resultArray;
        }, []);

        for (let i = 0; i < chunks.length; i++) {
            try {
                await this.saveUserData(chunks[i]);
            } catch (err) {}
        }
    }

    private async saveUserData(steamIDS: string[]): Promise<void> {
        const { data } = await axios({
            method: 'GET',
            url: 'https://backpack.tf/api/users/info/v1',
            params: {
                key: process.env.BPTF_API_KEY,
                steamids: steamIDS.join(','),
            },
        });

        const time = this.getUnix();

        for (const steamID64 in data.users) {
            const user = data.users[steamID64];
            const has = await this.usersModel
                .findOne({ steamID64: steamID64 })
                .lean();

            const donated = parseFloat((user?.donated || 0).toFixed(2));
            const suggestionsCreated = user?.voting?.suggestions?.created || 0;
            const suggestionsAccepted =
                user?.voting?.suggestions?.accepted || 0;
            const suggestionUnusual =
                user?.voting?.suggestions?.accepted_unusual || 0;

            const positiveTrust = user?.trust?.positive || 0;
            const negativeTrust = user?.trust?.negative || 0;

            if (!has) {
                await new this.usersModel({
                    steamID64,
                    name: user.name,
                    avatar: user.avatar,
                    donations: [{ time, amount: donated }],
                    suggestions: [
                        {
                            time,
                            created: suggestionsCreated,
                            nonUnusualAccepted: suggestionsAccepted,
                            unusualAccepted: suggestionUnusual,
                        },
                    ],
                    trusts: [
                        {
                            time,
                            positive: positiveTrust,
                            negative: negativeTrust,
                        },
                    ],
                    names: [
                        {
                            time,
                            name: user.name,
                        },
                    ],
                }).save();

                this.logger.debug(`Saved ${steamID64}!`);
            } else {
                const toUpdate = {};

                const { nonUnusualAccepted, unusualAccepted, created } =
                    has.suggestions[has.suggestions.length - 1];

                if (
                    nonUnusualAccepted !== suggestionsAccepted ||
                    unusualAccepted !== suggestionUnusual ||
                    created !== suggestionsCreated
                ) {
                    has.suggestions.push({
                        time,
                        created: suggestionsCreated,
                        nonUnusualAccepted: suggestionsAccepted,
                        unusualAccepted: suggestionUnusual,
                    });
                    toUpdate['suggestions'] = has.suggestions;
                }

                const { amount } = has.donations[has.donations.length - 1];

                if (amount !== donated) {
                    has.donations.push({
                        time,
                        amount: donated,
                    });
                    toUpdate['donations'] = has.donations;
                }

                const { name } = has.names[has.names.length - 1];

                if (name !== user.name) {
                    has.names.push({
                        time,
                        name: user.name,
                    });
                    toUpdate['names'] = has.names;
                }

                const { positive, negative } =
                    has.trusts[has.trusts.length - 1];

                if (positive !== positiveTrust || negative !== negativeTrust) {
                    has.trusts.push({
                        time,
                        positive: positiveTrust,
                        negative: negativeTrust,
                    });
                    toUpdate['trusts'] = has.trusts;
                }

                if (Object.keys(toUpdate).length !== 0) {
                    this.logger.debug(JSON.stringify(toUpdate));

                    toUpdate['name'] = user.name;
                    toUpdate['avatar'] = user.avatar;
                    await this.usersModel.updateOne(
                        {
                            steamID64,
                        },
                        toUpdate
                    );
                    this.logger.debug(`Updated ${steamID64}!`);
                }
            }
        }
    }

    private parseListing(listing: BuyListing | SellListing): {
        parts: string[];
        paint: string;
        spells: string[];
    } {
        const parsed = {
            parts: [],
            paint: '',
            spells: [],
        };

        if (!listing.item.attributes) return parsed;

        for (let i = 0; i < listing.item.attributes.length; i++) {
            const attribute = listing.item.attributes[i];

            if (!attribute.defindex) continue;

            if (attribute.defindex == 142) {
                parsed.paint = PAINTS[attribute.float_value] || 'Unknown Paint';
            } else if ([380, 382, 384].includes(attribute.defindex)) {
                // @ts-ignore
                parsed.parts.push(this.parts[attribute.float_value].type_name);
            } else if (SPELLS[attribute.defindex]) {
                parsed.spells.push(
                    SPELLS[attribute.defindex][attribute.float_value]
                );
            }
        }

        return parsed;
    }

    private getUnix(): number {
        return Math.round(new Date().getTime() / 1000);
    }
}
