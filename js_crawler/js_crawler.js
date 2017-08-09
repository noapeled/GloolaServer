var xAaCookieValue = null;

var _ = require('lodash');
var cheerio = require('cheerio');
var request = require('request');
var url = 'https://www.old.health.gov.il/units/pharmacy/trufot/Ycran_ListN.asp?p=14&Sr_Type=T_Name&Y_Name=&Letter=a&safa=h';

function getImages(str) {
    var myRegexp = /ShowFotoWinJv\(\'([^,']*)[,' ]*([^']*)/g;
    var match = myRegexp.exec(str);
    console.log(match[1], match[2]);
    console.log();
}

function doit(error, response, body) {
    const $ = cheerio.load(body);
    for (cls of ['RowTabl', 'RowDubTabl']) {
        $(`tr.${cls} > td > img`).each(function (i, elem) {getImages(elem.attribs.onclick)});
        $(`tr.${cls}`).each(function (i, elem) {console.log(i,
            _.map(_.filter(elem.children, c => c.name === 'td'), e => e.children[0].data)[2])});
    }
    const tcod = '066 56 28192 01';
    const tname = 'AMBISOME';
    var opts = {
        jar: true,
        cookie: xAaCookieValue,
        url: `https://www.old.health.gov.il/units/pharmacy/Trufot/ShowTrufaFoto.asp?TrCod=${tcod}&TrName=${tname}`,
        ciphers: 'DES-CBC3-SHA'
    };
    request(opts, function(erro, resp, body) { console.log(body); });
}

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
    const $ = cheerio.load(body);
    eval($('script')[0].children[0].data);
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
        xAaCookieValue = response.headers['x-aa-cookie-value'];
        request.get({ url: url, headers: { cookie: xAaCookieValue }, ciphers: 'DES-CBC3-SHA' }, doit);
    }
    request.post(opts, prt);
});

