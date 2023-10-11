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
    contact    : Association to one Contacts;
    items      : Composition of many OrdersItems
                     on items.order = $self;
    deliveryTo : Association to one Addresses;
}

entity Departments : cuid {
    name    : String;
    address : Composition of many Addresses
                  on address.department = $self;
}

entity Addresses : cuid {
    department : Association to one Departments;
    region     : Region;
    postCode   : String;
    street     : String;
    building   : String;
}

entity Contacts : cuid {
    firstName : String;
    lastName  : String;
    email     : String;
    title     : String;
    telephone : String;
    manager   : Association to one Contacts;
}


entity OrdersItems : cuid {
    order : Association to one Orders;
    item  : Association to one WarehousesProducts;
    qty   : Integer;
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
