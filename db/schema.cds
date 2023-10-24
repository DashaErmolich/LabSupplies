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

aspect Order : cuid, managed {
    title  : String;
    notes  : String;
    status : Association to one OrderStatuses;
}

entity Orders : Order {
    deliveryTo                     : Association to one Departments;
    contact                        : Association to one Contacts
                                         on contact.email = $self.createdBy;
    items                          : Composition of many OrderItems
                                         on items.order = $self;
    processor                      : Association to one Contacts;
    virtual isNotApprovable        : Boolean default true;
    virtual isNotRejectable        : Boolean default true;
    virtual isNotEditable          : Boolean default true;
    virtual isNotActionable        : Boolean default true;
    virtual isRelatedOrdersVisible : Boolean default false;
    reviewNotes                    : String;
    warehouseOrders                : Composition of many WarehouseOrders
                                         on warehouseOrders.parentOrder = $self;
    attachments                    : Composition of many Attachments
                                         on attachments.order = $self;
}

entity DeliveryForecasts : cuid {
    order                      : Association to one WarehouseOrders;
    predictedDate              : Timestamp;
    actualDate                 : Timestamp;
    virtual daysCounter        : Integer;
    virtual residualPercentage : Integer;
    virtual isCritical        : Boolean default false;
    virtual bulletChartTargetValue: Integer;
    virtual bulletChartForecastValue: Integer;
}

entity WarehouseOrders : Order {
    parentOrder      : Association to one Orders;
    items            : Composition of many WarehouseOrderItems
                           on items.order = $self;
    processor        : Association to one WarehouseContacts;
    warehouse        : Association to one Warehouses;
    deliveryForecast : Association to one DeliveryForecasts on deliveryForecast.order = $self;
    @Core.MediaType                  : 'application/pdf'
    @Core.ContentDisposition.Filename: fileName
    @Core.ContentDisposition.Type    : 'inline'
    virtual content  : LargeBinary;

    @Core.IsMediaType                : true
    virtual fileName : String;
}

entity OrderStatuses {
    key ID              : String  @Common.Text: name  @Common.TextArrangement: #TextOnly;
        name            : String;
        criticalityCode : Int16;
        ctiticalityName : String;
}

entity Attachments : cuid {
    @Core.MediaType                  : mediaType
    @Core.ContentDisposition.Filename: fileName
    content   : LargeBinary;

    @Core.IsMediaType                : true
    mediaType : String;
    fileName  : String;
    order     : Association to one Orders;
    notes     : String;
}

// -----------------------------------

aspect StructuralUnit {
    key ID  : UUID  @Common.Text: name  @Common.TextArrangement: #TextOnly;
    name    : String;
    address : Association to one Addresses;
}

// entity Organisations : StructuralUnit {
//     departments : Composition of many Departments
//                       on departments.organisation.ID = $self.ID;
//     warehouses  : Composition of many Warehouses
//                       on warehouses.organisation.ID = $self.ID;
// }

entity Departments : StructuralUnit {}

entity Warehouses : StructuralUnit {
    products : Composition of many WarehouseProducts
                   on products.warehouse = $self;
    contacts : Composition of many WarehouseContacts
                   on contacts.warehouse = $self;
}

// -----------------------------------

entity Addresses : cuid {
    department : Association to one Departments;
    region     : Association to one Regions;
    postCode   : String;
    street     : String;
    building   : String;
    city       : String;
}

// -----------------------------------

aspect Contact {
    key email : User;
    firstName : String;
    lastName  : String;
    fullName  : String;
    title     : String;
    tel       : String;
    photoUrl  : String;
}

entity Contacts : Contact {
    department : Association to one Departments;
    manager    : Association to one Contacts;
}

entity WarehouseContacts : Contact {
    warehouse : Association to one Warehouses;
    orders    : Association to many WarehouseOrders
                    on orders.processor = $self;
}

// -----------------------------------

aspect OrderItem : cuid {
    item : Association to one WarehouseProducts;
    qty  : Integer;
}

//@assert.unique.item: [item]
entity OrderItems : OrderItem {
    order : Association to one Orders;
}

entity WarehouseOrderItems : OrderItem {
    order            : Association to one WarehouseOrders;
    status           : Association to one OrderStatuses;

    @Core.MediaType                  : 'application/pdf'
    @Core.ContentDisposition.Filename: fileName
    @Core.ContentDisposition.Type    : 'inline'
    virtual content  : LargeBinary;

    @Core.IsMediaType                : true
    virtual fileName : String default 'Label.pdf';
}

// -----------------------------------

entity Categories {
    key ID   : UUID  @Common.Text: name  @Common.TextArrangement: #TextOnly;
        name : String;
}

entity Suppliers : cuid {
    name : String;
}

entity Products : cuid {
    category      : Association to one Categories;
    supplier      : Association to one Suppliers;
    title         : String;
    description   : String;
    supplierCatNo : String;
}

entity WarehouseProducts {
    key warehouse : Association to one Warehouses;
    key product   : Association to one Products;
        stock     : Integer;
}

// -----------------------------------
