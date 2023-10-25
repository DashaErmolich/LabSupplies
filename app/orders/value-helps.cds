using AppService as service from '../../srv/app-service';
using from '../../db/schema';
using from './object-page';
using from '../../db/common';

// ObjectPage - Delivery Info

annotate service.Orders with {
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

annotate service.DeliveryTargets with {
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

annotate service.Orders with @(Common.SideEffects #delivery: {
    $Type           : 'Common.SideEffectsType',
    SourceProperties: [deliveryTo_ID, ],
    TargetEntities  : [deliveryTo, ],
});

// ObjectPage - Items Info

annotate service.OrderItems with {
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

annotate service.OrderItems with @(Common.SideEffects: {
    $Type           : 'Common.SideEffectsType',
    SourceProperties: [item_product_ID, ],
    TargetEntities  : [item, ],
    TargetProperties: ['qty', ],
});

// ObjectPage - Items Info Linked Filters

annotate service.Catalogue with {
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

annotate service.Catalogue with {
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


// List Report


annotate service.WarehouseOrders with {
    ID @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'WarehouseOrders',
            Parameters : [
                    {
                        $Type : 'Common.ValueListParameterInOut',
                        LocalDataProperty : ID,
                        ValueListProperty : 'ID',
                    },
                ],
            Label : 'GGGGG',
        },
        Common.ValueListWithFixedValues : true
)};
annotate service.WarehouseOrders with {
    ID @Common.Text : {
        $value : title,
        ![@UI.TextArrangement] : #TextOnly,
    }
};

annotate service.WarehouseOrders with {
    ID @Common.Label : '{i18n>relatedOrdersTitles}'
};
annotate service.Contacts with {
    email @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Contacts',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : email,
                    ValueListProperty : 'email',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
        Common.Text : {
            $value : fullName,
            ![@UI.TextArrangement] : #TextFirst,
        }
)};

annotate service.Orders with @(
    UI.SelectionFields : [
        processor.email,
        warehouseOrders.ID,
        deliveryTo_ID,
    ]
);
annotate service.Orders with {
    deliveryTo @Common.Label : '{i18n>departmentTitle}';
    ID @Common.Label : '{i18n>orderID}';
};

annotate service.Contacts with {
    email @Common.Label : '{i18n>processorFullName}'
};
