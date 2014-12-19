@Grab(group='com.gmongo', module='gmongo', version='1.0')
@Grab(group='com.github.groovy-wslite', module='groovy-wslite', version='0.8.0')
import wslite.rest.*
import com.gmongo.GMongo
import com.mongodb.BasicDBObject
import org.bson.types.ObjectId;

import groovy.json.JsonBuilder

def mongo = new GMongo()



def client = new RESTClient("http://localhost:3100")

//println "clearing the database...";
//def db = mongo.getDB("bangalytics")
//db.entries.remove([:])

println "creating entries"


(0..1).each() {
  def personnelName = personnelName()

  try {
  def response = client.post(path: "/apia") {
      json _id: new ObjectId(), name: personnelName[0], surname: personnelName[1], dob: randomDOB().format("dd/MM/yyyy"), dateEntered: new Date()
  }
  } catch (wslite.rest.RESTContentParseException f) {
    //
  }
}


//def bangalytics = new RESTClient( 'https://localhost:3100/apia' )

//def db = mongo.getDB("bangalytics")

//println "clearing the database...";
//db.entries.remove([:])

//println "creating entries"

/*(0..1000).each() {

  def personnelName = personnelName()

  def entry = [name: personnelName[0], surname: personnelName[1], dob: randomDOB(), dateEntered: randomDate()] as BasicDBObject

  println "adding: ${entry.surname}, ${entry.name}"

  db.entries << entry
}*/


// functions

def personnelName() {
  def p = 'and marc son bert wick ness ton shire step ley ing sley'.split()
  def q = 'Lord Lady Viscount Baronet Marquis Sir Captain Admiral'.split()

  def firstName = (0..1).collect { p[rand(p.size())] }.join('').capitalize();
  def surname = (0..2).collect { p[rand(p.size())] }.join('').capitalize();

  return [firstName, surname]
}

def randomNumber() {
  return rand(200000);
}

def randomDate() {
  def dateA = Date.parse("dd-MM-yyyy mm:ss.SSS", "01-01-2013 " + rand(12) + ":" + rand(60) + "." + rand(999))
  int range = 365
  def randomInterval = new Random().nextInt(range)
  return dateA.plus(randomInterval)
}

def randomDOB() {
  def dateA = Date.parse("dd-MM-yyyy", "01-01-1949")
  def randomInterval = randomDays();
  return dateA.plus(randomInterval)
}

def randomDays() {
  def years = rand(50)
  def months = rand(12)
  def days = rand(365)
  return (years * 365) + (months * 30) + days;
}

def rand(number) {
  return new Random().nextInt(number)
}