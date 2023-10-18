using {
    sap.common.CodeList as CodeList,
    Currency,
    managed,
    sap,
    cuid,
    User,
} from '@sap/cds/common';

using {
    Regions,
    sap.common.UnitOfMeasure,
    sap.common.Criticality
} from './common.cds';

namespace db;

entity Orders : cuid, managed {
    title      : String;
    contact    : Association to one Contacts
                     on contact.email = $self.createdBy;
    items      : Composition of many OrderItems
                     on items.order = $self;
    deliveryTo : Association to one Addresses;
    notes      : String;
    status     : Association to one OrderStatuses;
}

entity Departments {
    key ID      : UUID  @Common.Text: name  @Common.TextArrangement: #TextOnly;
        name    : String;
        address : Composition of many Addresses
                      on address.department = $self;
}

entity Addresses : cuid {
    title      : String;
    department : Association to one Departments;
    region     : Association to one Regions;
    postCode   : String;
    street     : String;
    building   : String;
    city       : String;
}

entity Contacts {
    key email     : User;
        firstName : String;
        lastName  : String;
        fullName  : String;
        title     : String;
        tel       : String;
        manager   : Association to one Contacts;
}

@assert.unique.item: [item]
entity OrderItems : cuid {
    order : Association to one Orders;
    item  : Association to one WarehouseProducts;
    qty   : Integer;
}

entity WarehouseProducts {
    key warehouse : Association to one Warehouses;
    key product   : Association to one Products;
        stock     : Integer;
}

entity Products : cuid {
    category      : Association to one Categories;
    supplier      : Association to one Suppliers;
    title         : String;
    description   : String;
    supplierCatNo : String;
}

entity Categories {
    key ID   : UUID  @Common.Text: name  @Common.TextArrangement: #TextOnly;
        name : String;
}

entity Suppliers : cuid {
    name : String;
}

entity Warehouses : cuid {
    name     : String;
    region   : Association to one Regions;
    products : Composition of many WarehouseProducts
                   on products.warehouse = $self;
}

entity OrderStatuses {
    key ID              : UUID  @Common.Text: name  @Common.TextArrangement: #TextOnly;
        name            : String;
        criticalityCode : Int16;
}
