using db from '../db/schema';


service MyService {
    entity Foo as projection on db.Foo;
}