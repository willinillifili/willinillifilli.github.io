(function(global,factory){typeof exports==="object"&&typeof module!=="undefined"?module.exports=factory():typeof define==="function"&&define.amd?define(factory):(global=global||self,global.Mustache=factory())})(this,function(){"use strict";var objectToString=Object.prototype.toString;var isArray=Array.isArray||function isArrayPolyfill(object){return objectToString.call(object)==="[object Array]"};function isFunction(object){return typeof object==="function"}function typeStr(obj){return isArray(obj)?"array":typeof obj}function escapeRegExp(string){return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function hasProperty(obj,propName){return obj!=null&&typeof obj==="object"&&propName in obj}function primitiveHasOwnProperty(primitive,propName){return primitive!=null&&typeof primitive!=="object"&&primitive.hasOwnProperty&&primitive.hasOwnProperty(propName)}var regExpTest=RegExp.prototype.test;function testRegExp(re,string){return regExpTest.call(re,string)}var nonSpaceRe=/\S/;function isWhitespace(string){return!testRegExp(nonSpaceRe,string)}var entityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHtml(string){return String(string).replace(/[&<>"'`=\/]/g,function fromEntityMap(s){return entityMap[s]})}var whiteRe=/\s*/;var spaceRe=/\s+/;var equalsRe=/\s*=/;var curlyRe=/\s*\}/;var tagRe=/#|\^|\/|>|\{|&|=|!/;function parseTemplate(template,tags){if(!template)return[];var lineHasNonSpace=false;var sections=[];var tokens=[];var spaces=[];var hasTag=false;var nonSpace=false;var indentation="";var tagIndex=0;function stripSpace(){if(hasTag&&!nonSpace){while(spaces.length)delete tokens[spaces.pop()]}else{spaces=[]}hasTag=false;nonSpace=false}var openingTagRe,closingTagRe,closingCurlyRe;function compileTags(tagsToCompile){if(typeof tagsToCompile==="string")tagsToCompile=tagsToCompile.split(spaceRe,2);if(!isArray(tagsToCompile)||tagsToCompile.length!==2)throw new Error("Invalid tags: "+tagsToCompile);openingTagRe=new RegExp(escapeRegExp(tagsToCompile[0])+"\\s*");closingTagRe=new RegExp("\\s*"+escapeRegExp(tagsToCompile[1]));closingCurlyRe=new RegExp("\\s*"+escapeRegExp("}"+tagsToCompile[1]))}compileTags(tags||mustache.tags);var scanner=new Scanner(template);var start,type,value,chr,token,openSection;while(!scanner.eos()){start=scanner.pos;value=scanner.scanUntil(openingTagRe);if(value){for(var i=0,valueLength=value.length;i<valueLength;++i){chr=value.charAt(i);if(isWhitespace(chr)){spaces.push(tokens.length);indentation+=chr}else{nonSpace=true;lineHasNonSpace=true;indentation+=" "}tokens.push(["text",chr,start,start+1]);start+=1;if(chr==="\n"){stripSpace();indentation="";tagIndex=0;lineHasNonSpace=false}}}if(!scanner.scan(openingTagRe))break;hasTag=true;type=scanner.scan(tagRe)||"name";scanner.scan(whiteRe);if(type==="="){value=scanner.scanUntil(equalsRe);scanner.scan(equalsRe);scanner.scanUntil(closingTagRe)}else if(type==="{"){value=scanner.scanUntil(closingCurlyRe);scanner.scan(curlyRe);scanner.scanUntil(closingTagRe);type="&"}else{value=scanner.scanUntil(closingTagRe)}if(!scanner.scan(closingTagRe))throw new Error("Unclosed tag at "+scanner.pos);if(type==">"){token=[type,value,start,scanner.pos,indentation,tagIndex,lineHasNonSpace]}else{token=[type,value,start,scanner.pos]}tagIndex++;tokens.push(token);if(type==="#"||type==="^"){sections.push(token)}else if(type==="/"){openSection=sections.pop();if(!openSection)throw new Error('Unopened section "'+value+'" at '+start);if(openSection[1]!==value)throw new Error('Unclosed section "'+openSection[1]+'" at '+start)}else if(type==="name"||type==="{"||type==="&"){nonSpace=true}else if(type==="="){compileTags(value)}}stripSpace();openSection=sections.pop();if(openSection)throw new Error('Unclosed section "'+openSection[1]+'" at '+scanner.pos);return nestTokens(squashTokens(tokens))}function squashTokens(tokens){var squashedTokens=[];var token,lastToken;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];if(token){if(token[0]==="text"&&lastToken&&lastToken[0]==="text"){lastToken[1]+=token[1];lastToken[3]=token[3]}else{squashedTokens.push(token);lastToken=token}}}return squashedTokens}function nestTokens(tokens){var nestedTokens=[];var collector=nestedTokens;var sections=[];var token,section;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];switch(token[0]){case"#":case"^":collector.push(token);sections.push(token);collector=token[4]=[];break;case"/":section=sections.pop();section[5]=token[2];collector=sections.length>0?sections[sections.length-1][4]:nestedTokens;break;default:collector.push(token)}}return nestedTokens}function Scanner(string){this.string=string;this.tail=string;this.pos=0}Scanner.prototype.eos=function eos(){return this.tail===""};Scanner.prototype.scan=function scan(re){var match=this.tail.match(re);if(!match||match.index!==0)return"";var string=match[0];this.tail=this.tail.substring(string.length);this.pos+=string.length;return string};Scanner.prototype.scanUntil=function scanUntil(re){var index=this.tail.search(re),match;switch(index){case-1:match=this.tail;this.tail="";break;case 0:match="";break;default:match=this.tail.substring(0,index);this.tail=this.tail.substring(index)}this.pos+=match.length;return match};function Context(view,parentContext){this.view=view;this.cache={".":this.view};this.parent=parentContext}Context.prototype.push=function push(view){return new Context(view,this)};Context.prototype.lookup=function lookup(name){var cache=this.cache;var value;if(cache.hasOwnProperty(name)){value=cache[name]}else{var context=this,intermediateValue,names,index,lookupHit=false;while(context){if(name.indexOf(".")>0){intermediateValue=context.view;names=name.split(".");index=0;while(intermediateValue!=null&&index<names.length){if(index===names.length-1)lookupHit=hasProperty(intermediateValue,names[index])||primitiveHasOwnProperty(intermediateValue,names[index]);intermediateValue=intermediateValue[names[index++]]}}else{intermediateValue=context.view[name];lookupHit=hasProperty(context.view,name)}if(lookupHit){value=intermediateValue;break}context=context.parent}cache[name]=value}if(isFunction(value))value=value.call(this.view);return value};function Writer(){this.templateCache={_cache:{},set:function set(key,value){this._cache[key]=value},get:function get(key){return this._cache[key]},clear:function clear(){this._cache={}}}}Writer.prototype.clearCache=function clearCache(){if(typeof this.templateCache!=="undefined"){this.templateCache.clear()}};Writer.prototype.parse=function parse(template,tags){var cache=this.templateCache;var cacheKey=template+":"+(tags||mustache.tags).join(":");var isCacheEnabled=typeof cache!=="undefined";var tokens=isCacheEnabled?cache.get(cacheKey):undefined;if(tokens==undefined){tokens=parseTemplate(template,tags);isCacheEnabled&&cache.set(cacheKey,tokens)}return tokens};Writer.prototype.render=function render(template,view,partials,tags){var tokens=this.parse(template,tags);var context=view instanceof Context?view:new Context(view,undefined);return this.renderTokens(tokens,context,partials,template,tags)};Writer.prototype.renderTokens=function renderTokens(tokens,context,partials,originalTemplate,tags){var buffer="";var token,symbol,value;for(var i=0,numTokens=tokens.length;i<numTokens;++i){value=undefined;token=tokens[i];symbol=token[0];if(symbol==="#")value=this.renderSection(token,context,partials,originalTemplate);else if(symbol==="^")value=this.renderInverted(token,context,partials,originalTemplate);else if(symbol===">")value=this.renderPartial(token,context,partials,tags);else if(symbol==="&")value=this.unescapedValue(token,context);else if(symbol==="name")value=this.escapedValue(token,context);else if(symbol==="text")value=this.rawValue(token);if(value!==undefined)buffer+=value}return buffer};Writer.prototype.renderSection=function renderSection(token,context,partials,originalTemplate){var self=this;var buffer="";var value=context.lookup(token[1]);function subRender(template){return self.render(template,context,partials)}if(!value)return;if(isArray(value)){for(var j=0,valueLength=value.length;j<valueLength;++j){buffer+=this.renderTokens(token[4],context.push(value[j]),partials,originalTemplate)}}else if(typeof value==="object"||typeof value==="string"||typeof value==="number"){buffer+=this.renderTokens(token[4],context.push(value),partials,originalTemplate)}else if(isFunction(value)){if(typeof originalTemplate!=="string")throw new Error("Cannot use higher-order sections without the original template");value=value.call(context.view,originalTemplate.slice(token[3],token[5]),subRender);if(value!=null)buffer+=value}else{buffer+=this.renderTokens(token[4],context,partials,originalTemplate)}return buffer};Writer.prototype.renderInverted=function renderInverted(token,context,partials,originalTemplate){var value=context.lookup(token[1]);if(!value||isArray(value)&&value.length===0)return this.renderTokens(token[4],context,partials,originalTemplate)};Writer.prototype.indentPartial=function indentPartial(partial,indentation,lineHasNonSpace){var filteredIndentation=indentation.replace(/[^ \t]/g,"");var partialByNl=partial.split("\n");for(var i=0;i<partialByNl.length;i++){if(partialByNl[i].length&&(i>0||!lineHasNonSpace)){partialByNl[i]=filteredIndentation+partialByNl[i]}}return partialByNl.join("\n")};Writer.prototype.renderPartial=function renderPartial(token,context,partials,tags){if(!partials)return;var value=isFunction(partials)?partials(token[1]):partials[token[1]];if(value!=null){var lineHasNonSpace=token[6];var tagIndex=token[5];var indentation=token[4];var indentedValue=value;if(tagIndex==0&&indentation){indentedValue=this.indentPartial(value,indentation,lineHasNonSpace)}return this.renderTokens(this.parse(indentedValue,tags),context,partials,indentedValue,tags)}};Writer.prototype.unescapedValue=function unescapedValue(token,context){var value=context.lookup(token[1]);if(value!=null)return value};Writer.prototype.escapedValue=function escapedValue(token,context){var value=context.lookup(token[1]);if(value!=null)return typeof value==="number"?String(value):mustache.escape(value)};Writer.prototype.rawValue=function rawValue(token){return token[1]};var mustache={name:"mustache.js",version:"4.0.1",tags:["{{","}}"],clearCache:undefined,escape:undefined,parse:undefined,render:undefined,Scanner:undefined,Context:undefined,Writer:undefined,set templateCache(cache){defaultWriter.templateCache=cache},get templateCache(){return defaultWriter.templateCache}};var defaultWriter=new Writer;mustache.clearCache=function clearCache(){return defaultWriter.clearCache()};mustache.parse=function parse(template,tags){return defaultWriter.parse(template,tags)};mustache.render=function render(template,view,partials,tags){if(typeof template!=="string"){throw new TypeError('Invalid template! Template should be a "string" '+'but "'+typeStr(template)+'" was given as the first '+"argument for mustache#render(template, view, partials)")}return defaultWriter.render(template,view,partials,tags)};mustache.escape=escapeHtml;mustache.Scanner=Scanner;mustache.Context=Context;mustache.Writer=Writer;return mustache});
$(document).ready(function(){const menu = {
    logo : "logo",
    item : [
      {
        title : "conectate",
        url : "https://www.clasificadoselectronicos.com/cgi-bin/micuenta.cgi",
        type : "onboarding"
      },
      {
        title : "registrate",
        url : "https://www.clasificadoselectronicos.com/puertorico/regusuario.htm",
        type : "onboarding"
      },
      {
        title : "premium",
        url : "https://www.clasificadoselectronicos.com/html-files/premium.htm",
        type : "onboarding"
      },
      {
        title : "contacto",
        url : "https://www.clasificadoselectronicos.com/contacto.htm",
        type: ""
      },
      {
        title : "categorias",
        url : "",
        type: "dropdown active"
      },
    ],
    category : [
      {
        title : "vehiculos",
        subcategories : [
          {
              title : "autos",
              url : "https://clasitronicos.com/cgi-bin/getcars.cgi?n=PR"
          },
          {
              title : "motoras",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=motoras"
          },
          {
              title : "botes",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=botes"
          },
          {
              title : "clasicos",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=antiguos"
          },
          {
              title : "aviones",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=aviones"
          },
          {
              title : "remolques",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=remolques"
          },
          {
              title : "pickups",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=pickups"
          },
          {
              title : "vanes",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=vanes"
          },

        ]
      },
      {
        title : "bienes raices",
        subcategories : [
          {
              title : "condominios",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=condominios"
          },
          {
              title : "casas venta",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=casasventas"
          },
          {
              title : "apartamentos",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=apartamentosalquiler"
          },
          {
              title : "casas renta",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=casasalquiler"
          },
          {
              title : "comerciales",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=comerciales"
          },
          {
              title : "vacaciones",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=vacaciones"
          },
          {
              title : "terrenos",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=terrenos"
          }
        ]
      },
      {
        title : "mucho mas",
        subcategories : [
          {
              title : "mascotas",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=mascotas"
          },
          {
              title : "muebles",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=muebles"
          },
          {
              title : "ropa",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=ropa"
          },
          {
              title : "enceres",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=enceres"
          },
          {
              title : "instrumentos",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=instrumentos"
          },
          {
              title : "libros",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=libros"
          },
          {
              title : "clases",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=clases"
          },
          {
              title : "mucho mas",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=miscelaneos"
          },
        ]
      },
      {
        title : "negocios",
        subcategories : [
          {
              title : "mega paginas",
              url : "https://clasitronicos.com/yellowpages.html"
          },
          {
              title : "servicios",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=servicios"
          },
          {
              title : "empleos",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=empleos"
          },
          {
              title : "salud",
              url : "https://www.clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=salud"
          },
          {
              title : "actividades",
              url : ""
          }
        ]
      },

    ]
};
const auto = [
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Acura",
    logo   : "acura.png",
    brand  : "acura",
    total  : "52",
    models : [
      {
        name : "beetle",
        total : "3",
      },
      {
        name : "ilx",
        total : "6",
      },
      {
        name : "mdx",
        total : "13",
      },
      {
        name : "rdx",
        total : "13",
      },
      {
        name : "rl",
        total : "3",
      },
      {
        name : "tlx",
        total : "3",
      },
      {
        name : "tsx",
        total : "8",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Audi",
    logo   : "audi.png",
    brand  : "audi",
    total  : "24",
    models : [
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
      {
        name : "a4",
        total : "3",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=BMW",
    logo   : "bmw.png",
    brand  : "bmw",
    total  : "99",
    models : [
      {
        name : "1-series",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Blue%20Bird",
    logo   : "bluebird.png",
    brand  : "blue bird",
    total  : "1",
    models : [
      {
        name : "",
        total : "",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Buick",
    logo   : "buick.png",
    brand  : "buick",
    total  : "19",
    models : [
      {
        name : "cascada",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Cadillac",
    logo   : "cadillac.png",
    brand  : "cadillac",
    total  : "25",
    models : [
      {
        name : "catera",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Chevrolet",
    logo   : "chevrolet.png",
    brand  : "chevrolet",
    total  : "407",
    models : [
      {
        name : "advance design",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Chrysler",
    logo   : "chrysler.png",
    brand  : "chrysler",
    total  : "70",
    models : [
      {
        name : "300",
        total : "4",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Dodge",
    logo   : "dodge.png",
    brand  : "dodge",
    total  : "316",
    models : [
      {
        name : "1500",
        total : "6",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Ferrari",
    logo   : "ferrari.png",
    brand  : "ferrari",
    total  : "6",
    models : [
      {
        name : "458",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Fiat",
    logo   : "fiat.png",
    brand  : "fiat",
    total  : "28",
    models : [
      {
        name : "500",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Freightliner",
    logo   : "ford.png",
    brand  : "ford",
    total  : "1671",
    models : [
      {
        name : "c-max hybrid",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Freightliner",
    logo   : "freightliner.png",
    brand  : "freightliner",
    total  : "2",
    models : [
      {
        name : "m2 106",
        total : "2",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=GMC",
    logo   : "gmc.png",
    brand  : "GMC",
    total  : "62",
    models : [
      {
        name : "acadia",
        total : "4",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Genesis",
    logo   : "genesis.png",
    brand  : "genesis",
    total  : "3",
    models : [
      {
        name : "g80",
        total : "3",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Harley-Davidson",
    logo   : "harley-davidson.png",
    brand  : "harley-davidson",
    total  : "1",
    models : [
      {
        name : "flstf",
        total : "",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Hino",
    logo   : "hino.png",
    brand  : "hino",
    total  : "11",
    models : [
      {
        name : "268",
        total : "1",
      },
    ]
  },
  {
    url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=Honda",
    logo   : "honda.png",
    brand  : "honda",
    total  : "318",
    models : [
      {
        name : "acccord",
        total : "72",
      },
    ]
  },
];

  template = $('#menu').html();
	output = Mustache.render(template, menu);
	$('#menu').html(output);

  if (isMobile()) {

    $(".menu > .logo").children("img").attr("src", "./assets/ClasitronicosLogo3.png");
  }

  let menuIsShowing = { state : 0 };
  let snackbarColor = { state : 0 };
  $(".snackbar").click( function(e){
    e.stopPropagation();
    toggleSnackbarColor(snackbarColor);
    toggle(menuIsShowing, ".categories", "showMenu", "removeClass",
               "addClass");
  });

  let subIsShowing = { state : 0 };
  $(".category-item").click(function(){
    let subcategories = $(this).children(".subcategories");
    toggle(subIsShowing, subcategories, "", "slideUp", "slideDown");
  })

  let dropDownShowing = { state : 0 };
  $(".dropdown").click(function(e) {
    let isMobile = $(".items").css("display") === "none";
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    dropDownShowing.state ?
    $(".categories").css("display", "none")
    : $(".categories").css("display", "grid");
    dropDownShowing.state = !dropDownShowing.state;
  });

  $("html, body").click(function() {
    let isMobile = $(".items").css("display") === "none";
    let subcategories = $(this).children(".subcategories");
    console.log(isMobile);
    if (isMobile) {
      toggle(subIsShowing, subcategories, "", "slideUp", "slideDown");
      return;
    }
    $(".categories").css("display", "none");
  })

/* HELPER FUNCTIONS */

/* pre: @initialToggleState is an object with the toggle state
        @element is a string selector or a dom node. It represents the element
        that will receive the toggle action.
        @arg is the argument that will be passed to the toggle actions
        @toggleAction1 & 2 are the names of the methods of @element that will
        be called when the toggle event is trigerred */

function toggle(initialToggleState, element, arg, toggleAction1,
                    toggleAction2) {
  initialToggleState.state ?
  $(element)[toggleAction1](arg) : $(element)[toggleAction2](arg);
  initialToggleState.state = !initialToggleState.state;
}

function toggleSnackbarColor(initialToggleState) {
  initialToggleState.state ?
  $(".snackbar").css("color", "white") : $(".snackbar").css("color", "black");
  initialToggleState.state = !initialToggleState.state;
}

function isMobile() {
  return isMobile = $(".items").css("display") === "none";
}

  let rawAutoData = $("#autos-data").text();
  let autos = parseAutoData(rawAutoData);
  let data = { autos : autos};

  template = $('#autos').html();
	output = Mustache.render(template, data);
	$('#autos').html(output);

  let isShowing = { state : 0 };
  $(".arrow").click(function(){
    let models = $(this).parent(".table-row").next(".models-wrapper");
    toggle(isShowing, models, "", "slideUp", "slideDown");
  })

  /* HELPER FUNCTIONS */

  function parseAutoData(rawData){
    rawData = rawData.replace(/\s/g, '');
    let splitByBrand = rawData.split("$,")
    let autoData = [];

    splitByBrand.forEach((item, i) => {
       splitByModel = item.split("*,");
       autoData.push(splitByModel);
    });

    autoData.splice(0, 1); // first element contains empty string
    let autoObjects = [];

    autoData.forEach((item, i) => {
      let brandData = item[0].split(",");
      let modelData = item[1].split(",");
      modelData.splice(modelData.length - 1, 1);
      let modelObjects = [];
      for (let i = 1; i <= modelData.length - 1; i++) {
        modelObjects.push({
          name  : modelData[i - 1],
          total : modelData[i]
        });
        i++;
      }
      autoObjects.push({
        url    : "https://clasitronicos.com/cgi-bin/getadx.cgi?n=PR&c=autos&k=" + brandData[0],
        logo   : /*brandData[0].toLowerCase() +*/ "acura.png",
        brand   : brandData[0],
        total  : brandData[1],
        models : modelObjects
      });
    });

    return autoObjects;
  }
});