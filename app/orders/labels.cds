using db as schema from '../../db/schema';
using {Regions} from '../../db/common.cds';
using AppService from '../../srv/app-service.cds';

annotate schema.Departments with {
  name @title: '{i18n>departmentTitle}';
};

annotate schema.OrderStatuses with {
  name @title: '{i18n>status}';
};

annotate schema.Addresses with {
  title    @title: '{i18n>addressTitle}';
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

annotate schema.Warehouses with {
  name @title: '{i18n>warehouseName}';
};

annotate schema.WarehouseProducts with {
  stock @title: '{i18n>stock}';
};

annotate schema.Categories with {
  name @title: '{i18n>categoryName}';
};
