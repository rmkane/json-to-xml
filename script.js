const inputJson = document.querySelector("#input-json"),
  outputXml = document.querySelector("#output-xml");

const sampleJSON = `
{
  "glossary": {
    "title": "example glossary",
    "GlossDiv": {
      "title": "S",
      "GlossList": {
        "GlossEntry": {
          "ID": "SGML",
          "SortAs": "SGML",
          "GlossTerm": "Standard Generalized Markup Language",
          "Acronym": "SGML",
          "Abbrev": "ISO 8879:1986",
          "GlossDef": {
            "para": "A meta-markup language, used to create markup languages such as DocBook.",
            "GlossSeeAlso": ["GML", "XML"]
          },
          "GlossSee": "markup"
        }
      }
    }
  }
}
`;

// https://stackoverflow.com/a/59539264/1762224
const jsonToXml = (obj) => {
  let xml = "";
  for (let prop in obj) {
    if (prop === "Name") {
    } else {
      xml += obj[prop] instanceof Array ? "" : "<" + prop + ">";
    }
    if (obj[prop] instanceof Array) {
      xml += "<" + prop + ">";
      for (let array in obj[prop]) {
        if (prop === "Parameters") {
          let nObj = {};
          nObj[new Object(obj[prop][array])["Name"]] = new Object(
            obj[prop][array]
          )["DefaultValue"];
          xml += jsonToXml(nObj);
        } else {
          xml += jsonToXml(new Object(obj[prop][array])); //add values
        }
      }
      xml += "</" + prop + ">";
    } else if (typeof obj[prop] == "object") {
      xml += jsonToXml(new Object(obj[prop]));
    } else if (prop === "Name") {
      xml += "<Name=" + '"' + jsonToXml(new Object(obj[prop])) + '">';
    } else {
      xml += obj[prop];
    }
    if (prop === "Name") {
      //do nothing
    } else if (prop === "Parameters") {
      xml += obj[prop] instanceof Array ? "" : "</Parameters>";
      xml += "</Method>";
    } else {
      xml += obj[prop] instanceof Array ? "" : "</" + prop + ">";
    }
  }
  return xml.replace(/<\/?[0-9]{1,}>/g, "");
};

// 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
const transitions = {
  "single->single": 0,
  "single->closing": -1,
  "single->opening": 0,
  "single->other": 0,
  "closing->single": 0,
  "closing->closing": -1,
  "closing->opening": 0,
  "closing->other": 0,
  "opening->single": 1,
  "opening->closing": 0,
  "opening->opening": 1,
  "opening->other": 1,
  "other->single": 0,
  "other->closing": -1,
  "other->opening": 0,
  "other->other": 0,
};
const reg = /(>)\s*(<)(\/*)/g; // updated Mar 30, 2015
const wsexp = / *(.*) +\n/g;
const contexp = /(<.+>)(.+\n)/g;
const getTagType = (line) => {
  if (/<.+\/>/.test(line)) {
    return "single"; // is this line a single tag? ex. <br />
  } else if (/<\/.+>/.test(line)) {
    return "closing"; // is this a closing tag? ex. </a>
  } else if (/<[^!].*>/.test(line)) {
    return "opening"; // is this even a tag (that's not <!something>)
  } else {
    return "other";
  }
};
// https://stackoverflow.com/a/2893259/1762224
const formatXml = function (xml, pad = "\t") {
  const lines = xml
    .replace(reg, "$1\n$2$3")
    .replace(wsexp, "$1\n")
    .replace(contexp, "$1\n$2")
    .split("\n");
  let formatted = "",
    indent = 0,
    lastType = "other";
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.match(/\s*<\?xml/)) {
      formatted += ln + "\n";
      continue;
    }
    const type = getTagType(ln);
    const fromTo = lastType + "->" + type;
    lastType = type;
    let padding = "";
    indent += transitions[fromTo];
    for (let j = 0; j < indent; j++) {
      padding += pad;
    }
    if (fromTo == "opening->closing") {
      formatted = formatted.substring(0, formatted.length - 1) + ln + "\n";
    } else {
      formatted += padding + ln + "\n";
    }
  }

  return formatted;
};

const doConversion = (form) => {
  const input = form.elements.json.value;
  let obj;
  try {
    obj = JSON.parse(input);
  } catch (e) {}

  form.elements.xml.value = formatXml(jsonToXml(obj), "  ");
};

const convert = (event) => {
  event.preventDefault();
  doConversion(event.target);
};

inputJson.value = sampleJSON.trim();
doConversion(document.forms[0]);
