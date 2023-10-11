using {
    cuid,
    managed
} from '@sap/cds/common';

namespace db;

entity Foo : cuid {
    name: String;
}
