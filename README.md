# GloolaServer

The server uses RESTful API to administrate several collections of entities, as following.

## Authentication with JWT
At the beginning of a session, the client must first obtain a JWT token:

    POST /authenticate
    
    {
        "username": ...
        "password": ...
    }

If login details are correct, then the server will reply with a JWT token. The client then must incldue the token
in all subsequent API requests, either in the request body as

    {
        ...
        token: ...
    }

or in HTTP header

    X-ACCESS-TOKEN: ...

Tokens are valid for 1 day.
Username "admin" is always available and has unlimited access permissions, see password in separate mail.

## Get all entities in a collection
    GET /:collection    
*Note:* Currently disabled for /image, in order to avoid very large responses.

### Examples:
    GET /user
    GET /medicine

## Get any specific entity
    GET /:collection/:entity_id

### Examples:
    GET /user/tuli
    GET /medicine/x9999
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

### Example Medicine
    
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

## Create New User
    PUT /user
    Content-Type:application/json
    
    {
      username: <<<UNIQUE among users>>>,
      password: ascii128 encoded,
      email: <<<UNIQUE among users>>>  RFC 822 address
    }

## Update Existing User
Following are all the details you may update for a user, whether he/she is a patient or a caretaker.

    POST /user
    Content-Type:application/json
    
    {
        username: <<<UNIQUE among users>>>,
        password: ascii128 encoded,
        email: <<<UNIQUE among users>>>  RFC 822 address
        birthdate: Date,
        name: [forname, middlename0, middlename1, ..., surname],
        patients: [username],
        medical_info: {
              hmo: { one of: ['clalit', 'maccabi', 'meuhedet', 'leumit', null] },
              medication: [{
                  medicine_id: ascii128 string,
                  dosage_size: positive number,
                  frequency: [{ // Same format as for cron jobs
                      day_of_week: ...,
                      month_of_year: ...,
                      day_of_month: ...,
                      hour: ...,
                      minute: ...
                  }]
              }]
        }
    }

For now, users can freely add other users as patients. At a later stage, patients will be added through a more secure mechanism.

Note that when updating an entity, every specified field is COMPLETELY OVERWRITTEN.
So if you wish to preserve existing information, first GET the information, then RE-POST it along with new information. 
This applies also for updating medication for a user.

### Example Users: Patient and Caretaker
Yehoram is a patient who takes only one medicine: every day at 08:15pm, as well as every Tuesday and Saturday at 09:00am.

    {
      "username": "yehoram_gaon",
      "password": ...,
      "email": "yehoram.malkishua.gaon@pmail.com",
      "name": ["yehoram", "malkishua", "gaon"],
      "birthdate": "1943-09-22",
      "patients": [],
      "medical_info": {
          hmo: "maccabi",
          medication: [{
            medicine_id: "3334123",
            dosage_size: 2,
            frequency: [
                {"*", "*", "*", "20", "15"}, 
                {"3,7", "*", "*", "09", "00"}]
          }]
      }
    }
    
Zion is Yehoram's caretaker:

    {
      "username": "zion_coolness",
      "password": ...,
      "email": "zion@coolness.co.il",
      "name": ["Zion", "Coolness"],
      "patients": ["yehoram_gaon"],
      "medical_info": {}
    }

## Get Caretakers of Patient

    GET /caretakers
    
The server will reply with the following JSON body:
    
    [
        {"username": ..., "name": ..., "email": ...},
    ]
    
 ### Example
 Yehoram requests
 
    GET /caretakers
    
    X-ACCESS-TOKEN: <a JWT token which Yehoram obtained eralier>
 
 The server responds with JSON body:
 
    [
       { 
        "username": "zion_coolness", 
        "name": ["Zion", "Coolness"], 
        "email": "zion@coolness.co.il" 
       }
    ]

## Patient Indicates Medicine Taken
    POST /takenmedicine
    
    {
        "when": ISO 8601 date-time,
        "medicine_id": ...,
        "dosage": ...
    }

### Example of taken medicine
    POST /takenmedicine
    
    {
        "when": "2017-05-14T09:30:00Z",
        "medicine_id": 12345,
        "dosage": 1
    }

## Push or Pull Notifications
TBD.
