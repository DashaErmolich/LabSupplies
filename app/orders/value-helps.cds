using from '../../srv/app-service';
using from '../../db/schema';
using from './object-page';
using from '../../db/common';

// ObjectPage - Delivery Info

annotate AppService.Orders with {
    deliveryTo @Common: {
        Text           : deliveryTo.name,
        TextArrangement: #TextOnly,
        ValueList      : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'countryName',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'regionName',
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'departmentID',
                    LocalDataProperty: deliveryTo_ID,
                },
            ],
            CollectionPath : 'DeliveryTargets',
            SearchSupported: true,
        }
    }
};

annotate AppService.DeliveryTargets with {
    countryCode @Common: {
        ValueListWithFixedValues: true,
        Label                   : '{i18n>country}',
        ValueList               : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: countryCode,
                },
            ],
            CollectionPath : 'Countries',
            SearchSupported: true,
        }
    };

    regionCode  @Common: {
        ValueListWithFixedValues: true,
        Label                   : '{i18n>region}',
        ValueList               : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: regionCode,
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'name',
                    LocalDataProperty: regionName,
                },
                {
                    $Type            : 'Common.ValueListParameterFilterOnly',
                    ValueListProperty: 'country_code',
                },
                {
                    $Type            : 'Common.ValueListParameterIn', //Input parameter used for filtering
                    LocalDataProperty: countryCode,
                    ValueListProperty: 'country_code',
                },
            ],
            CollectionPath : 'Regions',
            SearchSupported: true,
        }
    }
};

annotate AppService.Orders with @(Common.SideEffects #delivery: {
    $Type           : 'Common.SideEffectsType',
    SourceProperties: [deliveryTo_ID, ],
    TargetEntities  : [deliveryTo, ],
});

// ObjectPage - Items Info

annotate AppService.OrderItems with {
    item @Common: {
        Text           : item.product.supplierCatNo,
        TextArrangement: #TextOnly,
        ValueList      : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'supplierCatNo',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'title',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'supplier',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'stock',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    ValueListProperty: 'productID',
                    LocalDataProperty: item_product_ID,
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'warehouseID',
                    LocalDataProperty: item_warehouse_ID,
                },
            ],
            CollectionPath : 'Catalogue',
            SearchSupported: true,
        }
    }
};

annotate AppService.OrderItems with @(Common.SideEffects: {
    $Type           : 'Common.SideEffectsType',
    SourceProperties: [item_product_ID, ],
    TargetEntities  : [item, ],
    TargetProperties: ['qty', ],
});

// ObjectPage - Items Info Linked Filters

annotate AppService.Catalogue with {
    warehouseCountryCode @Common: {
        ValueListWithFixedValues: true,
        Label                   : '{i18n>warehouseCountry}',
        ValueList               : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: warehouseCountryCode,
                },
            ],
            CollectionPath : 'Countries',
            SearchSupported: true,
        }
    };

    warehouseRegionCode  @Common: {
        ValueListWithFixedValues: true,
        Label                   : '{i18n>warehouseRegion}',
        ValueList               : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: warehouseRegionCode,
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'name',
                    LocalDataProperty: name,
                },
                {
                    $Type            : 'Common.ValueListParameterFilterOnly',
                    ValueListProperty: 'country_code',
                },
                {
                    $Type            : 'Common.ValueListParameterIn', //Input parameter used for filtering
                    ValueListProperty: 'country_code',
                    LocalDataProperty: warehouseCountryCode,
                },
            ],
            CollectionPath : 'Regions',
            SearchSupported: true,
        }
    }
};

// ObjectPage - Items Info Other Filters

annotate AppService.Catalogue with {
    category @Common: {
        Text                    : category.name,
        TextArrangement         : #TextOnly,
        ValueListWithFixedValues: true,
        Label                   : '{i18n>categoryName}',
        ValueList               : {
            $Type          : 'Common.ValueListType',
            Parameters     : [
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name',
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'ID',
                    LocalDataProperty: category_ID,
                },
            ],
            CollectionPath : 'Categories',
            SearchSupported: true,
        }
    };

    supplier @Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            $Type          : 'Common.ValueListType',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterOut',
                ValueListProperty: 'name',
                LocalDataProperty: supplier,
            }, ],
            CollectionPath : 'Suppliers',
            SearchSupported: true,
        }
    };
};
annotate AppService.WarehouseOrders with @(
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'items',
            ID : 'items',
            Target : 'items/@UI.LineItem#items',
        },
    ]
);
annotate AppService.WarehouseOrderItems with @(
    UI.LineItem #items : [
        {
            $Type : 'UI.DataField',
            Value : item.product.title,
        },{
            $Type : 'UI.DataField',
            Value : qty,
            Label : 'qty',
        },{
            $Type : 'UI.DataField',
            Value : item.product.supplier.name,
        },{
            $Type : 'UI.DataField',
            Value : status.name,
        },
        {
            $Type : 'UI.DataField',
            Value : content,
            Label : 'content',
        },]
);
