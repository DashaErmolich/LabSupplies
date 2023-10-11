using {
    Country,
    sap.common.CodeList as CodeList,
    cuid,
    Currency,
    managed,
    sap,
    Addresses,
} from '@sap/cds/common';

using {
    sap.common.Region,
    sap.common.UnitOfMeasure,
    sap.common.Criticality
} from './common.cds';

namespace db;

entity Orders : cuid, managed {
    department       : Association to one FactoriesDepartments;
    contact          : Association to one Contacts;
    criticality_code : Integer;
    criticality      : Association to one Criticality
                           on criticality.code = criticality_code;
    items            : Composition of many OrdersItems
                           on items.order = $self;
}

entity Factories : cuid {
    name    : String;
    address : Association to one Addresses;
}

entity FactoriesDepartments : cuid {
    name     : String;
    factory  : Association to one Factories;
    contacts : Composition of many Contacts
                   on contacts.department = $self;
}

entity Contacts : cuid {
    firstName       : String;
    lastName       : String;
    email       : String;
    title      : String;
    manager    : Association to one Contacts;
    department : Association to one FactoriesDepartments;
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
