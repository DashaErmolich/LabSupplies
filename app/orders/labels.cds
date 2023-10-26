using db as schema from '../../db/schema';
using AppService as service from '../../srv/app-service.cds';

annotate schema.Departments with {
  name @title: '{i18n>departmentTitle}';
};

annotate schema.OrderStatuses with {
  name @title: '{i18n>status}';
};

annotate schema.Addresses with {
  postCode @title: '{i18n>postCode}';
  street   @title: '{i18n>street}';
  building @title: '{i18n>building}';
  region   @(Common.Label: '{i18n>departmentRegionName}');
};

annotate schema.Contacts with {
  firstName @title: '{i18n>firstName}';
  lastName  @title: '{i18n>lastName}';
  fullName  @title: '{i18n>fullName}';
  email     @title: '{i18n>email}';
  tel       @title: '{i18n>tel}';
  title     @title: '{i18n>jobTitle}';
};

annotate schema.Suppliers with {
  name @title: '{i18n>supplierName}';
};

annotate schema.Products with {
  title         @title: '{i18n>title}';
  supplierCatNo @title: '{i18n>catNo}';
};

annotate schema.OrderItems with {
  qty @title: '{i18n>qty}';
};

annotate schema.WarehouseOrderItems with {
  qty @title: '{i18n>qty}';
};

annotate schema.Warehouses with {
  name @title: '{i18n>warehouseName}';
};

annotate schema.WarehouseProducts with {
  stock @title: '{i18n>stock}';
};

annotate schema.Categories with {
  name @title: '{i18n>categoryName}';
};

annotate schema.Orders with {
  notes       @title: '{i18n>orderNotes}';
  reviewNotes @title: '{i18n>reviewNotes}';
  title       @title: '{i18n>title}';
  progress    @title: '{i18n>progressIndicator}';
}

annotate schema.Attachments with {
  content @title: '{i18n>attachmentContent}';
  notes   @title: '{i18n>notes}';
};

annotate service.DeliveryTargets with {
  countryName @title: '{i18n>country}';
  regionName  @title: '{i18n>region}';
}

annotate service.WarehouseOrders with {
  ID @title: '{i18n>whOrderTitle}';
}


annotate service.Orders with {
  deliveryTo @Common.Label: '{i18n>departmentTitle}';
  ID         @Common.Label: '{i18n>orderID}';
};

annotate service.Contacts with {
  email @Common.Label: '{i18n>processorFullName}'
};

annotate service.Warehouses with {
  ID @Common.Label: '{i18n>warehouseID}'
};

annotate schema.DeliveryForecasts with {
  residualPercentage @(Measures.Unit: '%');
};
