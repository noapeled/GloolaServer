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
      medication: [{
        medicine_id,
        dosage_size: positive number,
        frequency: [{day_of_week, month_of_year, day_of_month, hour, minute}]  # Same as cron format
      }]
    }

### Example JSON body
The following patients takes only one medicine: every day at 08:15pm, as well as every Tuesday and Saturday at 09:00am.

    {
      name: ["yehoram", "malkishua", "gaon"],
      birthdate: "1943-09-22",
      hmo: "maccabi",
      email: "yehoram.malkishua.gaon@pmail.com",
      username: "0123456789",
      password: "elefneshikot",
      medication: [{
        medicine_id: "3334123",
        dosage_size: 2,
        frequency: [{"*", "*", "*", "20", "15"}, {"3,7", "*", "*", "09", "00"}]  # Same as cron format
      }]
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
