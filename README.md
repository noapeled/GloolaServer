# GloolaServer

The server uses RESTful API to administrate several collections of entities, as following.

## Get all entities in a collection
    GET /:collection    
*Note:* Currently disabled for /image, in order to avoid very large responses.

### Examples:
    GET /user
    GET /medicine
    GET /patient

## Get any specific entity
    GET /:collection/:entity_id

### Examples:
    GET /user/tuli
    GET /medicine/x9999
    GET /patient/77ty12
    GET /image/myimage.png

## Create New Image
    PUT /image
    Content-Type:application/json
    
    {
      "image_id": <<<UNIQUE among images>>> ascii128 String,
      "format": ascii128 String, e.g. "png" or "jpg".
      "contents": base64-encoded String
    }
    
### Example
    PUT /image
    Content-Type:application/json
    
    {
      "image_id": "bobsponge",
      "format": "gif".
      "contents": "aHi32...t="
    }


## Update Existing Image
    POST /image
    Content-Type:application/json
    
    {
      "image_id": ...
    }

## Create New User
    PUT /user
    Content-Type:application/json
    
    {
      username: <<<UNIQUE among users>>> better make this the Israeli ID number,
      password: ascii128 encoded,
      email: <<<UNIQUE among users>>>  RFC 822 address
      patients: [patient_id]  # The patients whom this user is allowed to watch.
    }

## Update Existing User
    POST /user
    Content-Type:application/json
    
    {
      username: ...,
      ...
    }

## Create new patient
    PUT /patient
    Content-Type:application/json
    
    {
      patient_id: ascii128_encoded  # <<<UNIQUE among patients>>> Better make this the Israeli ID. 
      name: [forname, middle_name1, ..., middle_nameN, surname],  # Middle names optional, forname and surname mandatory
      birthdate: ISO8601 UTC Date,
      hmo: OneOf('clalit', 'maccabi', 'meuhedet', 'leumit', null),
      email: <<<UNIQUE among patients>>> RFC 822 address,
      medication: [{
        medicine_id,
        dosage_size: positive number,
        frequency: [{day_of_week, month_of_year, day_of_month, hour, minute}]  # Same as cron format
      }]
    }

### Example
The following patient takes only one medicine: every day at 08:15pm, as well as every Tuesday and Saturday at 09:00am.

    {
      patient_id: "0123456789"
      name: ["yehoram", "malkishua", "gaon"],
      birthdate: "1943-09-22",
      hmo: "maccabi",
      email: "yehoram.malkishua.gaon@pmail.com",
      medication: [{
        medicine_id: "3334123",
        dosage_size: 2,
        frequency: [{"*", "*", "*", "20", "15"}, {"3,7", "*", "*", "09", "00"}]  # Same as cron format
      }]
    }

## Update Existing Patient
    POST /patient
    Content-Type:application/json

    {
      patient_id: "0123456789"
      ...
    }
    
### Example
In the following example, note that the medication is COMPLETELY OVERWRITTEN by the given array.
So if you wish to preserve existing information, first GET the information, then re-POST it along with new information. 

    POST /patient
    Content-Type:application/json

    {
      patient_id: "0123456789"
      birthdate: "1943-08-21",
      medication: [{
         medicine_id: "7777777",
         dosage_size: 11,
         frequency: [{"1,2", "*", "*", "22", "33"}]
      }]
    }

## Add New Medicine
    PUT /medicine
    Content-Type:application/json
    
    {
      medicine_id: <<<UNIQUE among medicine>>> ascii128 encoded,
      medicine_names: [ascii128 encoded],
      images: [image_id],
      route_of_administration: ascii128 encoded,
      dosage_form: ascii128 encoded,
      manufacturer: ascii128 encoded,
      basic_dose: ascii128 encoded
    }

### Example JSON Body
    
    {
      medicine_id: "3334123",
      images: [],
      route_of_administration: "oral",
      dosage_form: "tablets"
    }

## Update Existing Medicine
    POST /medicine
    Content-Type:application/json
    
    {
      medicine_id: ...,
      ...
    }
