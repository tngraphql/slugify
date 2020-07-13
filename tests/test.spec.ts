/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/13/2020
 * Time: 5:43 PM
 */
import {getBaseModel, getDb, ormAdapter} from "./helpers";
import {column} from "@tngraphql/lucid/build/src/Orm/Decorators";
import {DateTime} from "luxon";
import {Slugify} from "../lib/Sluglife";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Utils | syncDiff', () => {
    beforeAll(async () => {
        db = getDb()
        BaseModel = getBaseModel(ormAdapter(db))
    })
    test('return ids to be added', async () => {
        class CategoryModel extends BaseModel {
            public static table = 'categories';

            @column({ isPrimary: true, consume: value => String(value) })
            public id: string

            @column()
            public name: string;

            @column()
            public slug: string;

            @column.dateTime({ autoCreate: true })
            public createdAt: DateTime

            @column.dateTime({ autoCreate: true, autoUpdate: true })
            public updatedAt: DateTime

            public static boot() {
                super.boot();

                Slugify.slugifyModel(this, {
                    source: ['name'],
                    slugOptions: { lower: true },
                    overwrite: true,
                    column: 'slug'
                });
            }
        }

        await CategoryModel.create({name: 'nguyen'});
        await CategoryModel.create({name: 'nguyen'});
        await CategoryModel.create({name: 'nguyen'});

        const user = await CategoryModel.create({name: 'nguyen'});

        await CategoryModel.truncate(true);
    })

});