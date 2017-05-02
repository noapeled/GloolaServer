import httplib
import urllib2
import socket
import ssl
import pprint
import sys
import json
from PIL import Image
import os
import requests
import base64
class TLS1Connection(httplib.HTTPSConnection):
    """Like HTTPSConnection but more specific"""
    def __init__(self, host, **kwargs):
        httplib.HTTPSConnection.__init__(self, host, **kwargs)

    def connect(self):
        """Overrides HTTPSConnection.connect to specify TLS version"""
        # Standard implementation from HTTPSConnection, which is not
        # designed for extension, unfortunately
        sock = socket.create_connection((self.host, self.port),
                self.timeout, self.source_address)
        if getattr(self, '_tunnel_host', None):
            self.sock = sock
            self._tunnel()

        # This is the only difference; default wrap_socket uses SSLv23
        self.sock = ssl.wrap_socket(sock, self.key_file, self.cert_file,
                ssl_version=ssl.PROTOCOL_TLSv1)

class TLS1Handler(urllib2.HTTPSHandler):
    """Like HTTPSHandler but more specific"""
    def __init__(self):
        urllib2.HTTPSHandler.__init__(self)

    def https_open(self, req):
        return self.do_open(TLS1Connection, req)

def pdf_to_jpg(name):
    pdf = file(name+".pdf", "rb").read()

    startmark = "\xff\xd8"
    startfix = 0
    endmark = "\xff\xd9"
    endfix = 2
    i = 0

    njpg = 0
    while True:
        istream = pdf.find("stream", i)
        if istream < 0:
            break
        istart = pdf.find(startmark, istream, istream+20)
        if istart < 0:
            i = istream+20
            continue
        iend = pdf.find("endstream", istart)
        if iend < 0:
            raise Exception("Didn't find end of stream!")
        iend = pdf.find(endmark, iend-20)
        if iend < 0:
            raise Exception("Didn't find end of JPG!")
         
        istart += startfix
        iend += endfix
        jpg = pdf[istart:iend]
        jpgfile = file(name+".jpg" , "wb")
        jpgfile.write(jpg)
        jpgfile.close()
         
        njpg += 1
        i = iend

class MethodRequest(urllib2.Request):
    def __init__(self, *args, **kwargs):
        if 'method' in kwargs:
            self._method = kwargs['method']
            del kwargs['method']
        else:
            self._method = None
        return urllib2.Request.__init__(self, *args, **kwargs)

    def get_method(self, *args, **kwargs):
        if self._method is not None:
            return self._method
        return urllib2.Request.get_method(self, *args, **kwargs)
        
# Override default handler
urllib2.install_opener(urllib2.build_opener(TLS1Handler()))
pp = pprint.PrettyPrinter(indent=4)

drug_dict = {}
def read_drug_letter(letter):
    print "starting"
    #change number of pages!
    for page in xrange(1,10):
        try:
        #if (True):
            res = urllib2.urlopen("https://www.old.health.gov.il/units/pharmacy/trufot/Ycran_ListN.asp?p="+str(page)+"&Sr_Type=T_Name&Y_Name=&Letter="+letter+"&safa=e")
            allpage = res.read()
            alltables = allpage.split("<table")
            #the forth table has all the medics
            drug_table = alltables[4].split("</table>")[0]
            drugs_rows = drug_table.split("<tr>")
            for i in xrange(len(drugs_rows)):
                if i==0 or i==1:
                    continue
                cells = drugs_rows[i].split("<td")
                #the english name
                eng_name_cell = cells[3]
                eng_name = eng_name_cell.split(">")[2].split("<")[0].strip().split("\xae")[0]

                #get the pictures (pdfs)
                if "ShowFotoWinJv" in drugs_rows[i]:
                    TCod, TName, servrename = drugs_rows[i].split("ShowFotoWinJv")[1].split(")")[0].split(",")
                    TCod = TCod[2:-1].replace(" ","%20")
                    TName = TName[1:-1].replace(" ","%20")
                    
                    tmpParm="/units/pharmacy/Trufot/ShowTrufaFoto.asp?TrCod=" + TCod+"&TrName=" + TName
                    img_url = "https://www.old.health.gov.il/"+tmpParm
                    img_res = urllib2.urlopen(img_url)
                    

                    img_html = img_res.read()
                    if "ShowAlonWinJv" not in img_html:
                        first_image_place = img_html.split("src")[1].split('"')[1]
                        first_img_url = "https://www.old.health.gov.il" + first_image_place

                        jpg_response = urllib2.urlopen(first_img_url)
                        filename = eng_name.replace(" ","_").replace("/","_")
                        file = open(filename+"_1.jpg", 'w')
                        file.write(jpg_response.read())
                        file.close()

                        '''if "jpg" in img_html:
                            first_image_place = img_html.split("src")[1].split('"')[1]
                            first_img_url = "https://www.old.health.gov.il" + first_image_place


                            jpg_response = urllib2.urlopen(first_img_url)
                            filename = eng_name.replace(" ","_").replace("/","_")
                            file = open(filename+"_1.jpg", 'w')
                            file.write(jpg_response.read())
                            file.close()'''

                    else:
                        if "jpg" in img_html:
                            first_image_place = img_html.split("ShowAlonWinJv")[2]
                            first_img_url = "https://www.old.health.gov.il/" + first_image_place.split("'")[1]


                            jpg_response = urllib2.urlopen(first_img_url)
                            filename = eng_name.replace(" ","_").replace("/","_")
                            file = open(filename+"_1.jpg", 'w')
                            file.write(jpg_response.read())
                            file.close()
                        else:
                            first_image_place = img_html.split("ShowAlonWinJv")[2]
                            first_img_url = "https://www.old.health.gov.il/" + first_image_place.split("'")[1]
                            

                            pdf_response = urllib2.urlopen(first_img_url)
                            filename = eng_name.replace(" ","_").replace("/","_")
                            file = open(filename+"_1.pdf", 'w')
                            file.write(pdf_response.read())
                            file.close()

                            pdf_to_jpg(filename+"_1")
                            os.remove(filename+"_1.pdf")

                            foo = Image.open(filename+"_1.jpg")
                            x,y = foo.size
                            foo = foo.resize((500,int((500.0/x)*y)),Image.ANTIALIAS)
                            foo.save(filename+"_1.jpg",quality=40)

                            second_image_place = img_html.split("ShowAlonWinJv")[3]
                            second_img_url = "https://www.old.health.gov.il/" + second_image_place.split("'")[1]

                            pdf_response = urllib2.urlopen(second_img_url)
                            filename = eng_name.replace(" ","_").replace("/","_")
                            file = open(filename+"_2.pdf", 'w')
                            file.write(pdf_response.read())
                            file.close()

                            pdf_to_jpg(filename+"_2")
                            os.remove(filename+"_2.pdf")

                            foo = Image.open(filename+"_2.jpg")
                            x,y = foo.size
                            foo = foo.resize((500,int((500.0/x)*y)),Image.ANTIALIAS)
                            foo.save(filename+"_2.jpg",quality=40)
                
                filename = eng_name.replace(" ","_").replace("/","_")
                if(os.path.isfile(filename+"_1.jpg") ):
                    with open(filename+"_1.jpg", "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read())
                    r = requests.put('http://35.184.65.179:3000/image',json=
        {
          "image_id": filename,
          "format": "jpg",
          "contents": encoded_string
        })

                    if r.status_code==400:
                        r = requests.post('http://35.184.65.179:3000/medicine',json={
          "image_id": filename,
          "format": "jpg",
          "contents": encoded_string
        })
                    
                #enter the drug page
                sifa = cells[2].split("href")[1][2:].split('"')[0].replace(" ","%20")
                drug_url = "https://www.old.health.gov.il/units/pharmacy/trufot/"+sifa
                drug_res = urllib2.urlopen(drug_url)
                drug_page = drug_res.read()
                drug_tables = drug_page.split("<table")
                drug_data_table = drug_tables[4]
                

                #get the Route of Admin
                Route_of_Admin=drug_data_table.split("Route")[1].split(">")[4].split("<")[0]

                #get the Dosage Form
                Dosage_form=drug_data_table.split("Dosage")[1].split(">")[4].split("<")[0]

                #get the Manufacturer
                Manufacturer=drug_data_table.split("Manufacturer")[1].split(">")[4].split("<")[0]

                #get the basic dosage
                basic_dosage = drug_tables[7].split("Active Ingredient")[1].split(">")[6].split("<")[0]
     
                drug_dict[eng_name] = (Route_of_Admin,Dosage_form,Manufacturer,basic_dosage)

       
         
      #'dosage_form': str(Dosage_form),
      #'manufacturer': str(Manufacturer)
        
                r = requests.get('http://35.184.65.179:3000/medicine/1')
                print r.status_code
                print r.json
                print "#############"
                r = requests.put('http://35.184.65.179:3000/medicine',json={
       'medicine_id': str(len(drug_dict)),
      'medicine_names': [str(eng_name)],
      'images': [filename],
      'route_of_administration': Route_of_Admin,
      'dosage_form': Dosage_form,
      'manufacturer': Manufacturer,
      'basic_dosage': basic_dosage
    })

                if r.status_code==400:
                    Route_of_Admin="im"
                    r = requests.post('http://35.184.65.179:3000/medicine',json={
            'medicine_id': str(len(drug_dict)),
      'medicine_names': [str(eng_name)],
      'images': [filename],
      'route_of_administration': Route_of_Admin,
      'dosage_form': Dosage_form,
      'manufacturer': Manufacturer,
      'basic_dosage': basic_dosage
    })
                print r.status_code
                    
                

               
        except:
            print "Unexpected error:", sys.exc_info()
            print "index: "+str(i)
            print page
            break
        
def read_just_A():
    read_drug_letter('a')
    pp.pprint(drug_dict)

def read_all_drugs():
    for i in xrange(26):
        read_drug_letter(chr(ord('a')+i))
read_all_drugs()
