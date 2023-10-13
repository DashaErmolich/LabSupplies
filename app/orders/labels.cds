using db as schema from '../../db/schema';

annotate schema.Departments with {
  name @title: '{i18n>departmentTitle}';
};

annotate schema.Addresses with {
  title    @title: '{i18n>addressTitle}';
  postCode @title: '{i18n>postCode}';
  street   @title: '{i18n>street}';
  building @title: '{i18n>building}';
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

annotate schema.OrdersItems with {
  qty @title: '{i18n>qty}';
};
