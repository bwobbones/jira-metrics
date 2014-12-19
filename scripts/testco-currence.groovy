@Grab(group='com.gmongo', module='gmongo', version='1.0')
import com.gmongo.GMongo
import groovy.json.JsonBuilder

def mongo = new GMongo()

def db = mongo.getDB("minhr")

List links = []
List nodes = []

class Link {
  String target
  String source
  String value
}

class Node {
  String name
  String group
}

def personnels = db.personnels.find()
personnels.roles.each() {
  println it.name
}

links << new Link(target: "1", source: "2", value: "3")
links << new Link(target: "4", source: "5", value: "6")
nodes << new Node(name: "greg", group: "group1")
nodes << new Node(name: "lexi", group: "group1")

def data = [
  nodes: nodes,
  links: links
]

def json = new JsonBuilder(data)

println json.toPrettyString()