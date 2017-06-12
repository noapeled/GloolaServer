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

# Image

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

# Medicine

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

# User

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
Note that medical information per user is updated through the separate ScheduledMedicine API.

    POST /user/<userid>
    Content-Type:application/json
    
    {
        push_tokens: [ascii128 encoded],
        name: [forname, middlename0, middlename1, ..., surname],
        password: ascii128 encoded,
        email: <<<UNIQUE among users>>>  RFC 822 address
        patients: [userid],
    }

For now, users can freely add other users as patients.
At a later stage, patients will be added through a more secure mechanism.

Note that when updating an entity, every specified field is COMPLETELY OVERWRITTEN.
So if you wish to preserve existing information -- e.g. push_tokens -- first GET the information, 
then RE-POST it along with new information. 

## Get User along with the user's Medical Information
    GET /user/<userid>

The server will return user details, including the user's actively scheduled medication (i.e. medication which isn't hidden).
Each actively scheduled medication also indicates when the user last took it.
  
    {
        userid: userid
        push_tokens: [ascii128 encoded],
        name: [forname, middlename0, middlename1, ..., surname],
        password: ascii128 encoded,
        email: <<<UNIQUE among users>>>  RFC 822 address
        patients: [userid],
        medical_info: {
            medication: [{
                    <details of scheduled medicine (see below)>,
                    last_taken: Date
            }]
        }
    }

# ScheduledMedicine
Each scheduled medicine comprises of the following details. Note the difference in identifiers:
* **scheduled_medicine_id** identifies the scheduled instance itself.
* **medicine_id** identifies which medicine is being scheduled.


    {
        scheduled_medicine_id: <ascii128 string, automatically assigned>,
        userid: ...,
        medicine_id: ...,
        dosage_size: <positive number>,
        frequency: { // Same components as for cron jobs.
            day_of_week: ...,
            month_of_year: ...,
            day_of_month: ...,
            hour: ...,
            minute: ... 
        },
        start_time: Optional ISO-8601 date, indicating when the schedule starts.
                    Defaults to null, which means immediate start.    
        end_time: Optional ISO-8601 date, indicating when the schedule ends.
                  Defaults to null, which means the schedule never ends.
        nag_offset_minutes: Optional positive number of minutes for a nag about medicine not taken. 
                            Defaults to 30.
        alert_offset_minutes: Optional positive number of minutes for alerts about medicine not taken.
                            Defaults to 60.
    }

# Creating and changing Scheduled Medicine
Creation is done through HTTP PUT, similarly as for other collections.
Notice that each ScheduledMedicine has exactly one frequency. For several frequencies per medicine, create multiple SheduledMedicine with the same medicine_id.

Once created, all fields of the ScheduledMedicine instance get be changed through HTTP POST, except for userid and medicine_id.

# Getting Scheduled Medicine of User
See above "Get User along with the user's Medical Information".

# Patient Feed
The following events are retained in a history feed for each patient.


 Event Type                           | Event Contents                                         
 -------------                  | ------------------------------------------------- 
 'scheduled_medicine_not_taken' | Same contents as corresponding alert notification 
 'scheduled_medicine_updated' | The JSON body of the corresponding POST request 
 'scheduled_medicine_taken' | The contents of the corresponding taken_medicine entity  
 'scheduled_medicine_created' | The contents of the corresponding, newly created ScheduledMedicine entity.

Each feed event has the following format.

    {
        userid: <patient's userid>,
        when: ISO-8601 Date,
        scheduled_medicine_id: ...,
        event: { 
            type: <as in above table>,
            contents: <as in above table>
        }
    }


The server sends every new feed event as push notification to all caretakers of the patient.
In addition, the entire feed is accessible through

    GET /feed/:patientid
    
To which the server will respond with an unordered list of all feed events for the patient.

# Additional API

## Get Caretakers of Patient

    GET /caretakers/:userid
    
Where userid identifies the patient.
The server will reply with all caretakers of the patient, in the following JSON body:
    
    [
        {"userid": ..., "name": ..., "email": ...},
    ]
    
## Indicate Medicine Taken
    PUT /takenmedicine
    
    {
        scheduled_medicine_id: ...
        userid: ...
        when: ISO-8601 Date
        dosage: ...
    }
    
Note that scheduled_medicine_id is used, not medicine_id.
That is, each indication of taken medicine is associated with a certain scheduled medicine.
Although userid is a redundant detail, it is required for ease of retrieval.

## Query taken medicine
    GET /takenmedicine/:userid?latest=<number>
    
The server will respond with the latest <number> records of medicine taken by userid.
If parameter latest is omitted, defaults to all records.

## Get Medicine Names by Substring

    GET /medicine/names/:substring
    
The server will respond with all medicine names which match :substring, along with corresponding medicine_id's.
The matching is done in a case-insensitive manner, e.g.
    
    GET /medicine/names/LL

may be responded with the following message

    [
        { medicine_names: ["hello"], medicine_id: "x111" },
        { medicine_names: ["yellow", "JeLLo"], medicine_id: "z66t42" }
    ]
    
## Push Notifications
Suppose that at moment _T_, patient _p_ is scheduled to take medicine _m_.
Then at time _T_, the server sends to _p_ a reminder to take medicine _m_.
Afterwards, the server checks twice whether _p_ has taken _m_: at _T_+30min and at _T_+60min.
* If _p_ hasn't taken _m_ by the time of the first check, then the server sends a nag to _p_.
* If _p_ hasn't taken _m_ by the time of the second check, then the server sends alerts to all caretakers of _p_.

The server sends all the above messages as Firebase push messages.
Nags and reminders are sent to all push_tokens of _p_, whereas alerts are sent to all push_tokens of all caretakers of _p_.
In all cases, the messages have the following format.

    {
        to: pushToken,
        collapse_key: 'do_not_collapse',
        data: {
            type: <One of: 'reminder_take_medicine', 'nag_medicine_not_taken', 'alert_medicine_not_taken'>,
            userid: userid,
            medicine_id: medicine_id,
            timeframe: {
                start: <the time T when the patient should have taken the medicine>,
                elapsed_milliseconds: <milliseconds since T>
            }
        }
    }
