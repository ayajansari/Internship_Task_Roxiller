import express from "express"
import mongoose, { mongo } from "mongoose"
import axios from "axios"
import cors from "cors"
const app=express()
const port=3000
app.use(cors())


const uri='mongodb://localhost:27017/myDB'
await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000  // Increase timeout to 30 seconds
  })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

const mp={
    "jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,"jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12
}


const dataSchema = new mongoose.Schema(
    {
    title: String,
    price: Number,
    description: String,
    category:String,
    image:String,
    sold:Boolean,
    dateOfSale:Date
  }
);
const DataModel=mongoose.model("DataModel",dataSchema)


async function storeData(urlData){

    try{

        await DataModel.deleteMany();

        for (let item of urlData) {
            const newData = new DataModel({
                title: item.title, 
                price: item.price,
                description:item.description,
                category:item.category,
                image:item.image,
                sold:item.sold,
                dateOfSale:item.dateOfSale    
            });
            await newData.save();
            
        }
        console.log(`Saved data to MongoDB`);
    }catch(e){
        console.log("error :",e)
    }
}

async function fetchData(){
    axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json')
    .then((res)=>{
        
        storeData(res.data)
    })
    .catch((e)=>{
        console.log("error while fetchData: ", e)
    })
}

app.get('/',(req,res)=>{
    fetchData();//initialize database

})


app.get('/statistics',(req,res)=>{
    
    const month=mp[req.query.monthData];
    let noOfSoldRecords=0,noOfNotSoldRecords=0,totalAmount=0;
    let finalStatisticsData={};

    DataModel.find({
        $and: [
            { 
                $expr: { $eq: [{ $month: "$dateOfSale" }, month] }  // extract records with month
            },
            { sold: true }  //and are also sold out
        ]
    })
    .then(filteredResults => {
        noOfSoldRecords=filteredResults.length;
        const ids = filteredResults.map(doc => doc._id);
    
        return DataModel.aggregate([
            { $match: { _id: { $in: ids } } },
            { $group: { _id: null, totalPrice: { $sum: "$price" } } }
        ]);
    })
    .then(result => {
        totalAmount=result[0].totalPrice;
        finalStatisticsData["Amount"]=totalAmount
        finalStatisticsData["Sold"]=noOfSoldRecords
 
    })
    .then(()=>{
        DataModel.find({
            $and: [
                { 
                    $expr: { $eq: [{ $month: "$dateOfSale" }, month] }  // 2 represents February 
                },
                { sold: false }
            ]
        })
        .then(result=>{
            noOfNotSoldRecords=result.length
            finalStatisticsData["notSold"]=noOfNotSoldRecords
            res.send(finalStatisticsData)
        })
        .catch(e=>{
            console.log("error fetching not sold records",e)
        })
    
    })
    .catch(err => {
        console.error('Error fetching sold records:', err);
    });
})


app.get('/barchart',(req,res)=>{

    const month=mp[req.query.monthData];
   
    DataModel.find( { 
            $expr: { $eq: [{ $month: "$dateOfSale" }, month] }  // extract records with month
        }    
    )
    .then((records)=>{
        const ids = records.map(doc => doc._id);

        DataModel.aggregate([
            { $match: { _id: { $in: ids } } },
            {
                $bucket: {
                  groupBy: "$price",  // Field to group by
                  boundaries: [0, 100, 200, 300, 400,500,600,700,800,900,Infinity],  // Bucket boundaries
                  default: "Other",  // Bucket id for values not falling into any bucket
                  output: {
                    count: { $sum: 1 }  // Count the number of documents in each bucket
                  }
                }
            }
        ])
        .then((output)=>{

            res.send(output)
        })
        
    })
    .catch(e=>{
        console.log("error during barchar data :",e)
    })
   
})


app.get('/piechart',(req,res)=>{

    const month=mp[req.query.monthData];
    DataModel.find({
        
         $expr: { $eq: [{ $month: "$dateOfSale" }, month] }  // extract records with month
             
    })
    .then(filteredResults => {
        
        const ids = filteredResults.map(doc => doc._id);
        DataModel.aggregate([
            { $match: { _id: { $in: ids } } },
            {
                $group: {
                  _id: "$category",
                  count: { $sum: 1 }
                }
            } 
        ])
        .then((data)=>{

            res.send(data)
        })
    })
    .catch((e)=>{
        console.log("error while getting piechart : ",e)
    })
})

app.listen(port,()=>{
    console.log(`server is running on port:`,port)
})

