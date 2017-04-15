import httplib
import urllib2
import socket
import ssl
import pprint
import sys
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


# Override default handler
urllib2.install_opener(urllib2.build_opener(TLS1Handler()))
pp = pprint.PrettyPrinter(indent=4)

drug_dict = {}
def read_drug_letter(letter):
    #change number of pages!
    for page in xrange(1,5):
        try:
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
                    
                        if "jpg" in img_html:
                            first_image_place = img_html.split("src")[1].split('"')[1]
                            first_img_url = "https://www.old.health.gov.il" + first_image_place


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

                        second_image_place = img_html.split("ShowAlonWinJv")[3]
                        second_img_url = "https://www.old.health.gov.il/" + second_image_place.split("'")[1]

                        pdf_response = urllib2.urlopen(second_img_url)
                        filename = eng_name.replace(" ","_").replace("/","_")
                        file = open(filename+"_2.pdf", 'w')
                        file.write(pdf_response.read())
                        file.close()

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
        except:
            print "Unexpected error:", sys.exc_info()[0]
            print "index: "+str(i)
            print page
            break
        
def read_just_A():
    read_drug_letter('a')
    pp.pprint(drug_dict)

def read_all_drugs():
    for i in xrange(26):
        read_drug_letter(chr(ord('a')+i))
read_just_A()
