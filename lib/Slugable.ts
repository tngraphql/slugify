/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/15/2020
 * Time: 9:28 PM
 */
import {Slugify} from "./Sluglife";

class Slugable {
    public static bootSlugable() {
        const Model = this as any;

        const m: any = new this;

        let configs = {};

        if (typeof m.sluggable !== "function") {
            throw new Error('Please the sluggable configuration for this model.')
        }

        Slugify.slugifyModel(Model, m.sluggable());
    }
}

export { Slugable };