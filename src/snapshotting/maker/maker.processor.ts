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

@Processor('maker')
export class MakerProcessor {
    private readonly logger = new Logger(MakerProcessor.name);

    private readonly parts: SchemaEnum = requireStatic('parts') as SchemaEnum;

    constructor(
        @InjectModel('snapshots')
        private snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings') private listingsModule: Model<ListingDocument>,
        private snapshotsGateway: SnapshotsGateway
    ) {}

    @Process('snapshot')
    async handleSnapshot(job: Job<{ sku: string }>): Promise<void> {
        await this.generateSnapshot(job.data.sku).catch(() => null);
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

    private generateSnapshot(sku: string): Promise<SnapshotNamespace.Snapshot> {
        return axios({
            method: 'GET',
            url: 'https://backpack.tf/api/classifieds/search/v1',
            params: this.parseSKUtoBPTF(sku),
            timeout: 10 * 1000,
        })
            .then(async (result: { data: SearchListingResponse }) => {
                let listings: SnapshotNamespace.Listing[] = [];

                let buyListings = 0;

                ['buy', 'sell'].forEach((side) => {
                    listings = listings.concat(
                        result.data[side].listings.map(
                            (listing: BuyListing | SellListing) => {
                                if (side === 'buy') buyListings++;

                                const parsed = this.parseListing(listing);
                                return {
                                    buying: side === 'buy',
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
                            }
                        )
                    );
                });

                const ids = [];

                const time = this.getUnix();

                for (let i = 0; i < listings.length; i++) {
                    const has = await this.listingsModule
                        .findOne({ 'listing.listingID': listings[i].listingID })
                        .lean();

                    if (!has) {
                        const doc = await new this.listingsModule({
                            sku,
                            listing: {
                                ...listings[i],
                            },
                            savedAt: time,
                            lastSeen: time,
                        }).save();

                        ids.push(doc._id);
                    } else {
                        await this.listingsModule.updateOne(
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
                }

                await new this.snapshotsModel({
                    sku,
                    listings: ids,
                    savedAt: time,
                }).save();

                this.snapshotsGateway.emitMessage('snapshot', {
                    listings: {
                        buy: buyListings,
                        sell: listings.length - buyListings,
                    },
                    sku,
                    name: stringify(parseSKU(sku)),
                });

                return {
                    sku,
                    listings: ids,
                };
            })
            .catch(() => null);
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
