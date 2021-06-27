import axios from 'axios';
import { stringify, parseSKU } from 'tf2-item-format/static';
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

@Processor('maker')
export class MakerProcessor {
    private readonly logger = new Logger(MakerProcessor.name);

    private readonly parts: SchemaEnum = requireStatic('parts') as SchemaEnum;

    constructor(
        @InjectModel('snapshots')
        private snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings') private listingsModel: Model<ListingDocument>,
        @InjectModel('users') private usersModel: Model<UserDocument>,
        private snapshotsGateway: SnapshotsGateway
    ) {}

    @Process('snapshot')
    async handleSnapshot(job: Job<{ sku: string }>): Promise<void> {
        await this.generateSnapshot(job.data.sku).catch((err) =>
            this.logger.warn(`Failed to save ${job.data.sku}`, err)
        );
    }

    private generateSnapshot(sku: string): Promise<SnapshotNamespace.Snapshot> {
        const name = stringify(parseSKU(sku));

        return axios({
            method: 'GET',
            url: 'https://backpack.tf/api/classifieds/search/v1',
            params: this.parseSKUtoBPTF(sku),
            timeout: 10 * 1000,
        })
            .then(async (result: { data: SearchListingResponse }) => {
                let listings: SnapshotNamespace.Listing[] = [];

                let buyListings = 0;

                const steamIDS: string[] = [];

                ['buy', 'sell'].forEach((side) => {
                    listings = listings.concat(
                        result.data[side].listings
                            .filter((listing: BuyListing | SellListing) => {
                                if (
                                    listing.item.name
                                        .replace('The', '')
                                        .trim() !==
                                    name.replace('The', '').trim()
                                )
                                    return false;

                                return true;
                            })
                            .map((listing: BuyListing | SellListing) => {
                                if (side === 'buy') buyListings++;

                                const parsed = this.parseListing(listing);
                                return {
                                    buying: side === 'buy',
                                    automatic: listing.automatic === 1,
                                    listingID: listing.id,
                                    paint: parsed.paint,
                                    spells: parsed.spells,
                                    parts: parsed.parts,
                                    currencies: fillCurrency(
                                        listing.currencies
                                    ),
                                    bumped: listing.bump,
                                    created: listing.created,
                                    steamID64: listing.steamid,
                                };
                            })
                    );
                });

                const ids = [];

                const time = this.getUnix();

                for (let i = 0; i < listings.length; i++) {
                    const has = await this.listingsModel
                        .findOne({ 'listing.listingID': listings[i].listingID })
                        .lean();

                    if (!has) {
                        const doc = await new this.listingsModel({
                            sku,
                            listing: {
                                ...listings[i],
                            },
                            savedAt: time,
                            lastSeen: time,
                        }).save();

                        ids.push(doc._id);
                    } else {
                        await this.listingsModel.updateOne(
                            {
                                'listing.listingID': listings[i].listingID,
                            },
                            {
                                listing: listings[i],
                                lastSeen: time,
                            }
                        );

                        ids.push(has._id);
                    }

                    if (!steamIDS.includes(listings[i].steamID64)) {
                        steamIDS.push(listings[i].steamID64);
                    }
                }

                const doc = await new this.snapshotsModel({
                    sku,
                    listings: ids,
                    savedAt: time,
                }).save();

                await this.saveUserData(steamIDS);

                this.snapshotsGateway.emitMessage('snapshot', {
                    listings: {
                        buy: buyListings,
                        sell: listings.length - buyListings,
                    },
                    sku,
                    name: stringify(parseSKU(sku)),
                    id: doc._id,
                    image: getImageFromSKU(sku),
                });

                this.logger.debug(`Saved ${sku}!`);

                return {
                    sku,
                    listings: ids,
                };
            })
            .catch(() => null);
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
                    toUpdate['suggestions'] = has.suggestions.slice().push({
                        time,
                        created: suggestionsCreated,
                        nonUnusualAccepted: suggestionsAccepted,
                        unusualAccepted: suggestionUnusual,
                    });
                }

                const { amount } = has.donations[has.donations.length - 1];

                if (amount !== donated) {
                    toUpdate['donations'] = has.donations.slice().push({
                        time,
                        amount: donated,
                    });
                }

                const { name } = has.names[has.names.length - 1];

                if (name !== user.name) {
                    toUpdate['names'] = has.names.slice().push({
                        time,
                        name: user.name,
                    });
                }

                const { positive, negative } =
                    has.trusts[has.trusts.length - 1];

                if (positive !== positiveTrust || negative !== negativeTrust) {
                    toUpdate['trusts'] = has.trusts.slice().push({
                        time,
                        positive: positiveTrust,
                        negative: negativeTrust,
                    });
                }

                if (Object.keys(toUpdate).length !== 0) {
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

    private parseSKUtoBPTF(sku: string) {
        const item_prop = parseSKU(sku);
        const australium = item_prop.australium === true ? 1 : -1;
        const craftable = item_prop.craftable === true ? 1 : -1;

        const options = {
            page_size: 30,
            item: stringify(parseSKU(`${sku.split(';')[0]};6`)),
            quality: item_prop.quality,
            killstreak_tier: item_prop.killstreak ? item_prop.killstreak : 0,
            australium: australium,
            craftable: craftable,
            key: process.env.BPTF_API_KEY,
            particle: null,
        };

        if (item_prop.effect !== null) options.particle = item_prop.effect;

        return options;
    }

    private getUnix(): number {
        return Math.round(new Date().getTime() / 1000);
    }
}
