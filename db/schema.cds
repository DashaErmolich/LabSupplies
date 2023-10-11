using {
    Country,
    sap.common.CodeList as CodeList,
    cuid,
    Currency,
    managed,
    sap,
} from '@sap/cds/common';

using {
    sap.common.Region,
    sap.common.UnitOfMeasure,
    sap.common.Criticality
} from './common.cds';

namespace db;

entity Orders : cuid, managed {
    items : Composition of many OrdersItems
                on items.order = $self;
}

entity OrdersItems : cuid {
    order   : Association to one Orders;
    product : Association to one WarehousesProducts;
}

entity WarehousesProducts {
    key warehouse : Association to one Warehouses;
    key product   : Association to one Products;
        stock     : Integer;
}

entity Products : cuid {
    category          : Association to one Categories;
    manufacturer      : Association to one Manufacturies;
    title             : String;
    description       : String;
    manufacturerCatNo : String;
}

entity Categories : cuid {
    name : String;
}

entity Manufacturies : cuid {
    name : String;
}

entity Warehouses : cuid {
    region   : Region;
    products : Composition of many WarehousesProducts
                   on products.warehouse = $self;
}
