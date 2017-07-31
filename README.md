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
    }

For now, users can freely add other users as patients.
At a later stage, patients will be added through a more secure mechanism.

Note that when updating an entity, every specified field is COMPLETELY OVERWRITTEN.
So if you wish to preserve existing information -- e.g. push_tokens -- first GET the information, 
then RE-POST it along with new information. 

## Get User along with Medical Information and Patients
    GET /user/<userid>

The server will return user details, including the user's actively scheduled medication (i.e. medication which isn't hidden).
Each actively scheduled medication also indicates when the user last took it.
  
    {
        userid: userid
        push_tokens: [ascii128 encoded],
        name: [forname, middlename0, middlename1, ..., surname],
        password: ascii128 encoded,
        email: <<<UNIQUE among users>>>  RFC 822 address,
        patients: [userid], // If this user is the caretaker of any patient
        medical_info: {
            medication: [{
                    <details of scheduled medicine (see below)>,
                    last_taken: Date
            }]
        }
    }

# Take Medicine

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

# Caretaker

## Request to Become a Caretaker of a Patient

    PUT /caretaker
    
    {
        patient_email: <RFC 822 address>,
        nfc: <Optional, true if this request is initiated through NFC with the patient's device>
    }
    
The server will create a corresponding caretaker request:

    {
        request_id: <unique ascii string>,
        patient: <patient's userid>,
        caretaker: <caretaker's Userid>,
        status: 'pending'
    }

The server will also immediately push a nag to the patient:

    {
        type: 'caretaker_request',
        request: <the above-mentioned request object>,
        caretaker: { userid: ..., name: [...], email: ... }
    }

The server then repeats the nag once an hour, until the patient either accepts or rejects the request, see next.

## Patient Accepts or Rejects a Caretaker Request

    POST /caretaker/:requestId
    
    {
        status: 'accepted' or 'rejected'
    }

The server will update the status of the request, then notify the issuer of the caretaker request accordingly through push notification.

## Get All Caretakers of a Patient

    GET /allcaretakers/:patientUserid
    
The server will reply with all caretakers of the patient, in the following JSON body:
    
    [
        {"userid": ..., "name": ..., "email": ...},
    ]

## Get All Patients of a Caretaker
As described before, use

    GET /user/:userid
    
where userid is the caretaker's userid.

## Get All caretaker requests
Patients and caretakers can get all caretaker requests which involve them, using

    GET /caretakerrequest/:userid

The server will reply with all caretaker requests where patient or caretaker is userid, 
regardless of status, in the following format:

    [{
        request_id: ...,
        patient: <patient's userid>,
        status: ...,
        nfc: ...,
        caretaker: {
            userid: ...,
            email: ...,
            name: ... 
        }
    }]

# ScheduledMedicine
Each scheduled medicine comprises of the following details. Note the difference in identifiers:
**scheduled_medicine_id** identifies the scheduled instance itself, whereas **medicine_id** identifies which medicine is being scheduled.


    {
        no_notifications_if_taken_seconds_before_schedule: <optional number of seconds, defaults to 5 * 3600 (=5 hours)>,
        instructions: <optional ; ascii128 string>,
        scheduled_medicine_id: <ascii128 string, automatically assigned>,
        userid: ...,
        medicine_id: ...,
        dosage_size: <positive number>,
        frequency: { // Similar components as for cron jobs.
            day_of_week: ...,
            month_of_year: ...,
            day_of_month: ...,
            hour: ...,
            minute: ...,
            every_x_days: <positive number or null>
        },
        start_time: ISO-8601 date, indicating when the schedule starts. If every_x_days applies, then start_time provides the reference start day.
        end_time: Optional ISO-8601 date, indicating when the schedule ends.
                  Defaults to null, which means the schedule never ends.
        nag_offset_minutes: Optional positive number of minutes for a nag about medicine not taken. 
                            Defaults to 30.
        alert_offset_minutes: Optional positive number of minutes for alerts about medicine not taken.
                            Defaults to 60.
    }

## Create Scheduled Medicine

    PUT /scheduledmedicine/:patientid

The patientid appears in the URL and so should be omitted from the request body.

Notice that each ScheduledMedicine has exactly one frequency. For several frequencies per medicine, create multiple SheduledMedicine with the same medicine_id.

## Update Scheduled Medicine
Once created, all fields of the ScheduledMedicine instance get be changed through HTTP POST, except for userid and medicine_id.

**NOTE**: when a ScheduledMedicine instance is updated, it is re-scheduled for push notifications, and any pending nags and alerts for it are deleted. 

# Delete Scheduled Medicine
To deactivate a ScheduledMedicine, update it with

    { hidden: true }

# Get All Scheduled Medicine of User
See above "Get User along with the user's Medical Information".

## Push Notifications
Suppose that _S_ is a ScheduledMedicine for medicine _m_, which patient _p_ should take at moment _T_.
Then at time _T_, the server sends to _p_ a reminder to take medicine _m_.
Afterwards, the server checks twice whether _p_ has taken _m_:
* If _p_ hasn't taken _m_ by time _T_+_S_.nag_offset_minutes, then the server sends a nag to _p_.
* If _p_ hasn't taken _m_ by time _T_+_S_.alert_offset_minutes, then the server sends alerts to all caretakers of _p_.

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
            medicine_names: <array of medicine names, or null in case of retrieval error>,
            timeframe: {
                start: <the time T when the patient should have taken the medicine>,
                elapsed_milliseconds: <milliseconds since T>
            }
        }
    }

# Events Feed
The following events are retained in a history feed for each patient.


 Event Type                           | Event Contents                                         
 -------------                  | ------------------------------------------------- 
 'scheduled_medicine_created' | The contents of the corresponding ScheduledMedicine entity upon its creation.
 'scheduled_medicine_updated' | The JSON body of the corresponding POST request.
 'scheduled_medicine_taken' | The contents of the corresponding taken_medicine entity.  
 'scheduled_medicine_not_taken' | timeframe from corresponding alert notification.

Each feed event has the following format.

    {
        medicine_names: [...],
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
    
To which the server responds with a list of all feed events for the patient, sorted by "when".
Note that the contents of a single 'scheduled_medicine_updated' event can hold multiple changed fields.

## Example Feed

    [
        // Scheduled medicine created
        { 
            "medicine_names": ['meow', 'hatula'],
            "userid" : "user18770455181", 
            "when" : ISODate("2017-06-12T12:02:06.208Z"), 
            "scheduled_medicine_id" : "scheduledMedicine923665291", 
            "event" : { 
                "type" : "scheduled_medicine_created"
                "contents" : { "creation_date" : ISODate("2017-06-12T12:02:06.208Z"), "frequency" : ... }
            }
        },
        
        // Scheduled medicine taken soon enough
        {
            "medicine_names": ['meow', 'hatula'],
            "userid" : "user1690785181", 
            "when" : ISODate("2017-06-12T12:07:55.214Z"), 
            "scheduled_medicine_id" : "scheduledMedicine4084133411",
            "event" : {
                "type" : "scheduled_medicine_taken"
                "contents" : { "userid" : "user1690785181", "dosage" : 1.2, "scheduled_medicine_id" : "scheduledMedicine4084133411", "when" : "2017-05-19T23:33:45Z" } 
            }
        }
        
        
        // Scheduled medicine not taken soon enough
        { 
            "medicine_names": ['meow', 'hatula'],
            "userid" : "user9994527191",
            "when" : ISODate("2017-06-12T12:20:18.283Z"),
            "scheduled_medicine_id" : "scheduledMedicine19947837171", 
            "event" : { 
                "type" : "scheduled_medicine_not_taken",
                "contents" : { "timeframe" : { "elapsed_milliseconds" : 2005, "start" : ISODate("2017-06-12T12:20:16.278Z") 
            } 
        }
        
        // Scheduled medicine deleted
        { 
            "medicine_names": ['meow', 'hatula'],
            "userid" : "user1690785181", 
            "scheduled_medicine_id" : "scheduledMedicine3983002771", 
            "when" : ISODate("2017-06-12T13:07:55.413Z"), 
            "event" : {
                "type" : "scheduled_medicine_updated"
                "contents" : { "hidden" : true },
            }
        }
    ]
    
# Additional API

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
