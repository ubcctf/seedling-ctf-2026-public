create type user_role as enum (
  'over_18',
  'underage'
);

create table users (
  id       serial primary key,
  username text not null unique,
  password text not null,
  role     user_role not null default 'over_18',
  dollars  int not null default 0,
  credits  int not null default 1000
);

create table shop_items (
  id             int primary key,
  item_name      text not null unique,
  item_image_url text not null,
  price          int not null
);

create table owns (
  shop_item_id int not null references shop_items(id),
  user_id      int not null references users(id) on delete cascade,
  primary key (shop_item_id, user_id)
);

insert into shop_items (id, item_name, item_image_url, price) values
  (1, 'dog',     '/img/dog.jpg',     100),
  (2, 'cat',     '/img/cat.jpg',     200),
  (3, 'giraffe', '/img/giraffe.jpg', 500),
  (4, 'flag',    '/img/flag.jpg',    1000);
