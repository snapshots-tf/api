import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as md5 from 'blueimp-md5';
import { LeanDocument, Model } from 'mongoose';
import { BPTFSnapshotListing } from 'src/common/types/bptf';
import { fillCurrency } from 'src/lib/currency';
import { promiseDelay } from 'src/lib/helpers';
import { getImageFromSKU } from 'src/lib/images';
import PAINTS from 'src/lib/paints';
import { ListingDocument } from 'src/lib/schemas/listing.schema';
import { SnapshotDocument } from 'src/lib/schemas/snapshot.schema';
import { UserDocument } from 'src/lib/schemas/users.schema';
import SPELLS from 'src/lib/spells';
import { SnapshotsGateway } from 'src/routes/snapshots/snapshots.gateway';
import * as Currencies from 'tf2-currencies-lite';
import { parseSKU, stringify } from 'tf2-item-format/static';
import { requireStatic, SchemaEnum } from 'tf2-static-schema';
import { ItemService } from '../item/item.service';
import { KeyPricesService } from '../keyprices.service';

@Injectable()
export class MakerService {
    private readonly logger = new Logger(MakerService.name);

    private readonly parts: SchemaEnum = requireStatic('parts') as SchemaEnum;

    private readonly queue: string[] = [];

    private processing: boolean = false;

    constructor(
        @InjectModel('snapshots')
        private snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings') private listingsModel: Model<ListingDocument>,
        @InjectModel('users') private usersModel: Model<UserDocument>,
        private snapshotsGateway: SnapshotsGateway,
        private keyPricesService: KeyPricesService,
        private itemsService: ItemService
    ) {}

    getQueueCount(): number {
        return this.queue.length;
    }

    enqueue(sku: string): boolean {
        this.queue.push(sku);

        this.process();

        return true;
    }

    async enqueueAllItems(): Promise<void> {
        const items = await this.itemsService.getAllItems();

        items.forEach((sku) => this.enqueue(sku));
    }

    async process(): Promise<void> {
        if (this.processing === true) return;
        if (this.getQueueCount() === 0) {
            this.processing = true;
            await this.enqueueAllItems();
            this.processing = false;
            this.process();
        }

        const start = new Date().getTime();

        const entry = this.queue[0];
        this.processing = true;

        this.queue.splice(0, 1);

        try {
            await this.handleSnapshot(entry);
        } catch (err) {}

        const end = new Date().getTime();

        await promiseDelay(500 - (end - start));

        this.processing = false;

        this.process();
    }

    async handleSnapshot(sku: string): Promise<void> {
        this.logger.log(`Started processing ${sku}!`);
        if (!this.keyPricesService.getKeyPrice()) {
            this.logger.warn('No key price yet!');
            throw new Error('No key price!');
        }

        if (process.env.DEV === 'true') return;

        await this.generateSnapshots(sku).catch((err) => {
            console.log(err);
        });
    }

    private generateListingID(
        listing: BPTFSnapshotListing,
        name: string
    ): string {
        if (listing.intent === 'sell') {
            return '440_' + listing.steamid + '_' + listing.item.id;
        } else {
            return '440_' + listing.steamid + '_' + md5(name);
        }
    }

    private async getListings(sku: string): Promise<BPTFSnapshotListing[]> {
        return axios({
            method: 'GET',
            url: 'https://backpack.tf/api/classifieds/listings/snapshot',
            params: {
                sku: stringify(parseSKU(sku), { determineUniqueHat: true }),
                token: process.env.BPTF_TOKEN,
                appid: 440,
            },
            timeout: 5 * 1000,
        }).then((res) => res.data.listings || []);
    }

    private async generateSnapshots(sku: string): Promise<void> {
        const listings = await this.getListings(sku);
        const name = stringify(parseSKU(sku));

        if (!listings) return;

        const time = this.getUnix();
        const keyPrice = this.keyPricesService.getKeyPrice();

        let snapshot = [];

        const steamIDS: string[] = [];

        for (let i = 0; i < listings.length; i++) {
            const listing = listings[i];

            const parsed = this.parseListing(listing);

            if (!steamIDS.includes(listing.steamid))
                steamIDS.push(listing.steamid);

            const snapshotListing = {
                buying: listing.intent === 'buy',
                automatic:
                    listing.userAgent !== undefined &&
                    time - listing.userAgent.lastPulse < 5 * 60,
                listingID: this.generateListingID(listing, name),
                paint: parsed.paint,
                spells: parsed.spells,
                parts: parsed.parts,
                currencies: fillCurrency(listing.currencies),
                bumped: listing.bump,
                created: listing.timestamp,
                steamID64: listing.steamid,
            };

            snapshot.push(snapshotListing);
        }

        // Descending
        const buyListings = snapshot
            .filter((listing) => listing.buying)
            .sort((a, b) => {
                return (
                    new Currencies(b.currencies).toValue(keyPrice.metal) -
                    new Currencies(a.currencies).toValue(keyPrice.metal)
                );
            });
        // Ascending
        const sellListings = snapshot
            .filter((listing) => !listing.buying)
            .sort((a, b) => {
                return (
                    new Currencies(a.currencies).toValue(keyPrice.metal) -
                    new Currencies(b.currencies).toValue(keyPrice.metal)
                );
            });

        snapshot = buyListings.concat(sellListings);

        const ids: string[] = [];

        let buyListingsAmount = 0;

        for (let i = 0; i < snapshot.length; i++) {
            const listing = snapshot[i];
            const has = await this.listingsModel
                .findOne({
                    'listing.listingID': listing.listingID,
                })
                .lean();

            if (listing.buying) buyListingsAmount++;

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
                buy: buyListings.length,
                sell: snapshot.length - buyListingsAmount,
            },
            sku,
            name,
            id: doc._id,
            image: getImageFromSKU(sku),
        });

        this.logger.debug(`Saved ${sku} (${doc._id})!`);

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

        const users = await this.usersModel
            .find({
                steamID64: { $in: steamIDS },
            })
            .lean();

        for (let i = 0; i < chunks.length; i++) {
            try {
                await this.saveUserData(chunks[i], users);
            } catch (err) {}
        }
    }

    private async saveUserData(
        steamIDS: string[],
        users: LeanDocument<UserDocument>[]
    ): Promise<void> {
        const { data } = await axios({
            method: 'GET',
            url: 'https://backpack.tf/api/users/info/v1',
            params: {
                key: process.env.BPTF_API_KEY,
                steamids: steamIDS.join(','),
            },
            timeout: 5 * 1000,
        });

        const time = this.getUnix();

        const docsToSave = [];

        for (const steamID64 in data.users) {
            const user = data.users[steamID64];
            const has = users.find((user) => steamID64 === user.steamID64);

            const donated = parseFloat((user?.donated || 0).toFixed(2));
            const suggestionsCreated = user?.voting?.suggestions?.created || 0;
            const suggestionsAccepted =
                user?.voting?.suggestions?.accepted || 0;
            const suggestionUnusual =
                user?.voting?.suggestions?.accepted_unusual || 0;

            const positiveTrust = user?.trust?.positive || 0;
            const negativeTrust = user?.trust?.negative || 0;

            if (!has) {
                docsToSave.push({
                    steamID64,
                    name: user.name,
                    avatar: user.avatar,
                    donations: [{ time, amount: donated }],
                    lastSeen: this.getUnix(),
                    savedAt: this.getUnix(),
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
                });
            } else {
                const toUpdate = {};

                if (!has.savedAt && !has.lastSeen)
                    toUpdate['$set'] = {
                        savedAt: this.getUnix(),
                        lastSeen: this.getUnix(),
                    };

                if (has.lastSeen) toUpdate['lastSeen'] = this.getUnix();

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
                    toUpdate['name'] = user.name;
                    toUpdate['avatar'] = user.avatar;
                    await this.usersModel.updateOne(
                        {
                            steamID64,
                        },
                        toUpdate
                    );
                }
            }
        }

        await this.usersModel.insertMany(docsToSave);
    }

    private parseListing(listing: BPTFSnapshotListing): {
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
