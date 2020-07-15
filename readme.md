<div align="center">
  <img src="https://phantrungnguyen.com/63026323.png" width="200px">
</div>

# @tngraphql/slugify

[![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

## Options

slugifyModel takes an options object as it's second parameter.

```javascript
class ExampleModel extends BaseModel {
    @column({ isPrimary: true })
    public id: string

    @column()
    public name: string;

    @column()
    public slug: string;

    static boot() {
        super.boot();

        this.uses([Slugable]);
    }

    /**
     * Return the sluggable configuration array for this model.
     *
     * @return array
     */
    public sluggable() {
        return {
            source: ['name'],
            slugOptions: {lower: true},
            overwrite: false,
            column: 'slug'
        }
    }
}
```
Available Options

- `source` - (Required) Array of field names in the model to build the slug from.
- `suffixSource` - (Optional) Array of field names in the model to use as the source for additional suffixes to make the slug unique (before defaulting to adding numbers to the end of the slug).
- `slugOptions` - (Default `{lower: true}`) Pass additional options for slug generation as defined by [`slug`](https://github.com/dodo/node-slug).
- `overwrite` - (Default `TRUE`) Change the slug if the source fields change once the slug has already been built.
- `column` - (Default `slug`) Specify which column the slug is to be stored into in the model.


[npm-image]: https://img.shields.io/npm/v/@tngraphql/slugify.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/@tngraphql/slugify

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript

[license-url]: LICENSE.md
[license-image]: https://img.shields.io/npm/l/@tngraphql/slugify?style=for-the-badge
