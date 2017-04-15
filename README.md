# GloolaServer

## Add or update user
POST
Content-Type:application/json

{
  name: [forname, middle_name1, ..., middle_nameN, surname],
  birthdate: ISO8601 UTC Date,
  hmo: OneOf('clalit', 'maccabi', 'meuhedet', 'leumit', null),
  email: RFC 822 address,
  password: ascii coded,
  medication: [{medicine_id, }]
}

## Add or update medicine
POST
Content-Type:application/json
