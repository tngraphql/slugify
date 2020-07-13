/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/13/2020
 * Time: 5:28 PM
 */
import {LucidModel} from "@tngraphql/lucid/build/src/Contracts/Model/LucidModel";

const slug = require('sluglife');

const Fn = function () {
};

Fn.prototype.slugifyModel = function (Model, slugOptions) {
    // Get the target column
    const slugColumn = typeof slugOptions.column === 'undefined' ? 'slug' : slugOptions.column;

    // takes the array of source fields from the model instance and builds the slug
    const slugifyFields = function (instance, sourceFields) {
        const slugParts = sourceFields.map(function (slugSourceField) {
            return instance[slugSourceField];
        });

        const options = (slugOptions && slugOptions.slugOptions) || {lower: true};
        return slug(slugParts.join(' '), options);
    };

    /**
     * Checks whether or not the slug is already in use.
     *
     * @param slug The slug to check for uniqueness.
     * @return True if the slug is unique, false otherwise.
     */
    const checkSlug = function (slug) {
        return Model.findBy(slugColumn, slug).then(function (model) {
            return model === null;
        });
    };

    /**
     * Adds on additional suffixes based on the specified suffix fields.
     *
     * @param instance The model instance to use.
     * @param sourceFields An array of source fields to use to generate the base slug.
     * @param suffixFields An array of suffix fields to use to generate the additional slug suffixes.
     * @return A promise that resolves to a slug once a unique one is found or all of the suffix fields have been exhausted. Returns null if no suffix fields are provided.
     */
    const addSourceSuffix = function (instance, sourceFields, suffixFields) {
        return (function suffixHelper(instance, sourceFields, suffixFields, suffixCount) {
            if (!suffixFields || !Array.isArray(suffixFields)) {
                return Promise.resolve(null);
            }

            if (suffixCount > suffixFields.length) {
                return Promise.resolve(slugifyFields(instance, slugOptions.source.concat(suffixFields.slice(0))));
            }

            const slug = slugifyFields(instance, slugOptions.source.concat(suffixFields.slice(0, suffixCount)));

            return checkSlug(slug).then(function (isUnique) {
                if (isUnique) {
                    return slug;
                }

                return suffixHelper(instance, sourceFields, suffixFields, suffixCount + 1);
            });
        })(instance, sourceFields, suffixFields, 1);
    };

    /**
     * Adds on a numeric suffix (i.e., "-1") to the provided slug.
     *
     * @param slugValue The slug to add the numeric suffix onto.
     * @return A promise that resolves to a slug with the first numeric prefix that makes the slug unique.
     */
    const addNumericSuffix = function (slugValue) {
        return (function suffixHelper(slug, count) {
            const suffixedSlug = slug + '-' + count;

            return checkSlug(suffixedSlug).then(function (isUnique) {
                if (isUnique) {
                    return suffixedSlug;
                }

                return suffixHelper(slug, count + 1);
            });
        })(slugValue, 1);
    };

    // callback that performs the slugification on the create/update callbacks
    const handleSlugify = function (instance, options, next) {
        // we overwrite slug value on source field changes by default
        if (typeof slugOptions.overwrite === 'undefined') {
            slugOptions.overwrite = true;
        }

        // check if any of the fields used to build the slug have changed
        const changed = slugOptions.source.some(function (slugSourceField) {
            const value = instance.$attributes[slugSourceField];
            const originalValue = instance.$original[slugSourceField];

            return originalValue !== value
        });

        // current slug value
        let slugValue = instance[slugColumn];

        // if we had no slug OR our slug changed and overwrite options is true build a new slug
        if (!slugValue || (slugOptions.overwrite && changed)) {
            slugValue = slugifyFields(instance, slugOptions.source);
        } else {
            instance[slugColumn] = slugValue;

            return next ? next(null, instance) : instance;
        }

        // determine if the slug is unique
        return checkSlug(slugValue).then(function (isUnique) {
            // go ahead and return the unique slug
            if (isUnique) {
                return slugValue;
            }

            // add on suffixes from the provided source suffixes
            return addSourceSuffix(instance, slugOptions.source, slugOptions.suffixSource);
        }).then(function (slug) {
            // no source suffixes present
            if (slug === null) {
                return false;
            }

            if (slug === slugValue) {
                return slug;
            }

            slugValue = slug;

            // determine if the suffixed slug is unique
            return checkSlug(slug);
        }).then(function (isUnique) {
            // go ahead and return the unique suffixed slug
            if (isUnique) {
                return slugValue;
            }

            // add on numeric prefixes (i.e., "-1", "-2") until the slug is unique
            return addNumericSuffix(slugValue);
        }).then(function (slug) {
            // update the slug
            instance[slugColumn] = slug;

            return next ? next(null, instance) : instance;
        });
    };

    // attach model callbacks
    Model.before('create', handleSlugify.bind(Model));
    // Model.before('update', handleSlugify.bind(Model));

    // Model.beforeCreate('handleSlugify', handleSlugify);
    // Model.beforeUpdate('handleSlugify', handleSlugify);
};

type SlugOptions = {
    source: string[];
    suffixSource?: string[];
    slugOptions?: {
        replacement?: string,
        symbols?: boolean,
        remove?: RegExp,
        lower?: boolean,
        charmap?: string,
        multicharmap?: string
    };
    overwrite?: boolean;
    column?: string;
}

interface TngraphqlSlugifyInterface {
    slugifyModel(Model: LucidModel, slugOptions: SlugOptions);
}

export const TngraphqlSlugify: TngraphqlSlugifyInterface = new Fn();