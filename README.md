# GloolaServer

The server uses RESTful API to administrate several collections of entities.
All responses from the server are of the following format.

    {
        error: <false if response is successful, otherwise true or some Error object>
        message: <a JSON object with the requested contents.>
    }

## Login
Before a user makes requests to the server, the user must log in and obtain a token, which identifies the user in all subsequent requests.
This can be done either indirectly through Google login, or directly through the server.

### Logging in through Google
A client application logging in through Google must log in against the CLIENT_ID of Gloola Project, which is:

    798358484692-gr8595jlvqtslqte1gjg3bf8fb1clgg3.apps.googleusercontent.com

After logging in, all subsequent requests to the Gloola server must carry the Google token, 
preceded by the string "Google ", either in the request body as

    {
        ...
        token: Google <the_token_id_obtained_through_google_login>
    }
    
or in HTTP header

    X-ACCESS-TOKEN: Google <the_token_id_obtained_through_google_login>

The server then extracts the Gmail address from the Google token, and uses it to identify the user
who issues the request.

Google tokens expire after a time set by Google, which can be much shorter than the expiry time for tokens 
issued directly by the Gloola server.

### Logging in directly through the Gloola Server
At the beginning of a session, the client first obtains a JWT token:

    POST /authenticate
    
    {
        "userid" OR "email": ...
        "password": ...
    }

If login details are correct, then the server will reply with a JWT token. The client then includes the token
in all subsequent API requests, preceded by the string "JWT ". The token can appear in the request body as

    {
        ...
        token: JWT <the_jwt_token_from_the_authentication>
    }

or in HTTP header

    X-ACCESS-TOKEN: JWT <the_jwt_token_from_the_authentication>

JWT tokens issued by Gloola server are valid for 1 month.
Userid "admin" is always available and has unlimited access permissions, see password in separate mail.

### Getting userid for an authenticated user

    GET /whoami
    X-ACCESS-TOKEN: <JWT ...> or <Google ...> token
    
The server responds with message:

    {
        userid: <the_userid_of_the_user_whom_the_token_authenticates>
    }

## Get all entities in a collection
    GET /:collection    
*Note:* Currently disabled for /image, in order to avoid very large responses.

### Examples:
    GET /user
    GET /medicine

## Get any specific entity
    GET /:collection/:entity_id

### Examples:
    GET /user/user765  # See userid below
    GET /medicine/x9999
    GET /image/myimage.png

## Update Existing Entity
    POST /:collection/:entityID
    
    Content-Type:application/json
    
In the JSON body, include the properties that you wish to OVERWRITE. 
See next descriptions of available collections and entity details.

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


## Create New Medicine
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

## Create New User
    PUT /user
    Content-Type:application/json
    
    {
      name: [forname, middlename0, middlename1, ..., surname],  # forname and surname are required, middlenames optional.
      email: <<<UNIQUE among users>>>  RFC 822 address
      password: ascii128 encoded,
    }
    
The server assigns to each new user a unique, automatically generated userid.

## Update Existing User
Following are all the details you may update for a user, whether he/she is a patient or a caretaker.

    POST /user/<userid>
    Content-Type:application/json
    
    {
        push_tokens: [ascii128 encoded],
        name: [forname, middlename0, middlename1, ..., surname],
        password: ascii128 encoded,
        email: <<<UNIQUE among users>>>  RFC 822 address
        patients: [userid],
        medical_info: {
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
      "userid": "user123",  # Was automatically generated by the server.
      "name": ["yehoram", "malkishua", "gaon"],
      "password": ...,
      "email": "yehoram.malkishua.gaon@pmail.com",
      "patients": [],
      "medical_info": {
          medication: [{
            medicine_id: "3334123",
            dosage_size: 2,
            frequency: [
               { day_of_week: "*", month_of_year: "*", day_of_month: "*", hour: "20", minute: "15" },
               { day_of_week: "3,7", month_of_year: "*", day_of_month: "*", hour: "09", minute: "00" }
           ]
      }
    }
    
Zion is Yehoram's caretaker:

    {
      "userid": "user999",  # Was automatically generated by the server
      "name": ["Zion", "Coolness"],
      "password": ...,
      "email": "zion@coolness.co.il",
      "patients": ["user123"]
    }

## Get Caretakers of Patient

    GET /caretakers/:userid
    
Where userid identifies the patient.
The server will reply with all caretakers of the patient, in the following JSON body:
    
    [
        {"userid": ..., "name": ..., "email": ...},
    ]
    
 ### Example
 Yehoram requests
 
    GET /caretakers
    
    X-ACCESS-TOKEN: <a JWT token which Yehoram obtained eralier>
 
 The server responds with JSON body:
 
    [
       { 
        "userid": "user999", 
        "name": ["Zion", "Coolness"], 
        "email": "zion@coolness.co.il" 
       }
    ]

## Indication of Medicine Taken
    PUT /takenmedicine
    
    {
        "when": ISO 8601 date-time,
        "medicine_id": ...,
        "dosage": ...
    }

### Example of taken medicine
    PUT /takenmedicine
    
    {
        "when": "2017-05-14T09:30:00Z",
        "medicine_id": "z12345",
        "dosage": 1
    }

## Query taken medicine
    GET /takenmedicine/:userid?latest=<number>
    
The server will respond with the latest <number> records of medicine taken by userid.
If parameter latest is omitted, defaults to all records.

## Push or Pull Notifications
TBD. Note that push_tokens is already available for each user.
