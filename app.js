const express=require("express");
const bodyParser=require("body-parser");
const path=require("path");
const NodeCouchDb= require("node-couchdb");

const couch= new NodeCouchDb({
    auth:{
        user:"asad",
        pass:'12345'
    }
});


const dbName='customers';
const viewUrl='_design/all_customers/_view/all';


couch.listDatabases()
  .then(dbs => {
    if (Array.isArray(dbs)) {
      const databaseNames = dbs.map(db => db);
      // console.log("Databases:", databaseNames);
    } else {
      console.error("Error: Unexpected data received when listing databases.");
    }
  })
  .catch(err => {
    console.error("Error listing databases:", err);
  });


const app=express();
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/',async(req,res)=>{
    couch.get(dbName,viewUrl).then(
        function (data,headers,status) {
            // console.log(data.data.rows);
            res.render('index',{
                customers:data.data.rows
            });
        },
        function (err) {
            res.send(err);
    });
});


app.post('/customer/add',async(req,res)=>{
    const name=req.body.name;
    const email=req.body.email;

    couch.uniqid().then(function(ids){
      const id=ids[0];

      couch.insert(dbName,{
        _id:id,
        name:name,
        email:email
      }).then(
        function (data,headers,status) {
          res.redirect('/');
        },
        function (err) {
          res.send(err);
        });
    });
});

app.post("/customer/delete/:id", function(req,res){
  const id=req.params.id;
  const rev=req.body.rev;

  couch.del(dbName,id,rev).then(
    function (data,headers,status) {
      res.redirect('/');
    },
    function (err) {
      res.send(err)
    }
  )
})

app.post("/customer/update/:id", function(req,res){
  const id=req.params.id;
  const updateName=req.body.updateName;
  const updateEmail=req.body.updateEmail;
  const rev=req.body.rev;

  couch.update(dbName, {
    _id: id,
    _rev: rev,
    name: updateName,
    email: updateEmail
}).then(
    function (data,headers,status) {
      res.redirect('/');
    },
    function (err) {
      res.send(err)
    }
  )
})

app.listen(4000,async()=>{
    console.log("Server Started at Port 4000");
})
