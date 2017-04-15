# GloolaServer

## Add or update user
POST
Content-Type:application/json

{
  name: [forname, middle_name1, ..., middle_nameN, surname],
  birthdate: ISO8601 UTC Date,
  hmo: OneOf('clalit', 'maccabi', 'meuhedet', 'leumit', null),
  email: RFC 822 address,
  username: <better make this the Israeli ID number>,
  password: ascii128 encoded,
  medication: [{medicine_id, }]
}

## Add or update medicine
POST
Content-Type:application/json

{
  medicine_id: ascii128 encoded,
  images: TBD, ignore for now,
  route_of_administration: ascii128 encoded,
  dosage_form: ascii128 encoded
}
