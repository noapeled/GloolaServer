var cheerio = require('cheerio');
var request = require('request');
var url = 'https://www.old.health.gov.il/units/pharmacy/trufot/Ycran_ListN.asp?p=1&Letter=a&Sr_Type=T_Name&safa=h';
var options = {
    ciphers: 'DES-CBC3-SHA',
    url: url,
    jar: true
};

function test(var1)
{
    var var_str=""+Challenge;
    var var_arr=var_str.split("");
    var LastDig=var_arr.reverse()[0];
    var minDig=var_arr.sort()[0];
    var subvar1 = (2 * (var_arr[2]))+(var_arr[1]*1);
    var subvar2 = (2 * var_arr[2])+var_arr[1];
    var my_pow=Math.pow(((var_arr[0]*1)+2),var_arr[1]);
    var x=(var1*3+subvar1)*1;
    var y=Math.cos(Math.PI*subvar2);
    var answer=x*y;
    answer-=my_pow*1;
    answer+=(minDig*1)-(LastDig*1);
    answer=answer+subvar2;
    return answer;
}


request(options, function (error, response, body) {
    console.log('headers:', response.headers); // Print the HTML for the Google homepage.
    const $ = cheerio.load(body);
    eval($('script')[0].children[0].data);
    console.log(Challenge, ChallengeId, test(Challenge));
    var opts = {
        ciphers: 'DES-CBC3-SHA',
        jar: true,
        url: url,
        headers: {
            'X-AA-Challenge-ID': ChallengeId,
            'X-AA-Challenge-Result': test(Challenge),
            'X-AA-Challenge': Challenge,
            'Content-type': 'text/plain'
        }
    };
    function prt(error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        console.log('headers:', response.headers); // Print the HTML for the Google homepage.
        const xAaCookieValue = response.headers['x-aa-cookie-value'];
        console.log('xAaCookieValue is', xAaCookieValue);
        request.get({ url: url, headers: { cookie: xAaCookieValue }, ciphers: 'DES-CBC3-SHA' }, function (error, response, body) {console.log('body:', body,'\n', 'error:', error);});
    }
    request.post(opts, prt);
});

