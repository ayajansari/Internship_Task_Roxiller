import { useEffect, useState } from 'react'
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,ArcElement);


function App() {

  const [month,setMonth]=useState("jan")
  const [statisticsData,setStatisticsData]=useState({})
  const [barchartData,setBarchartData]=useState([])
  const [piechartData,setPieChartData]=useState([])
  const [dataForBarPlot,setDataForBarPlot]=useState()

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Sales',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };


  const handleSubmit=()=>{
    
  }
  useEffect(()=>{

    async function getData(){

      const monthData=month
      await axios.get('http://localhost:3000/statistics', {
        params: {
          monthData: monthData
        }
      })
      .then((res)=>{
        console.log("res length got:",res.data)
        setStatisticsData(res.data);
      })
      .catch(e=>{
        console.log("error while getting statistics data",e)
      })


      await axios.get('http://localhost:3000/barchart',{
        params:{
          monthData:monthData
        }
      })
      .then((res)=>{
        
        let barchartObj={};
        let arr = new Array(10).fill(0);
        let barData = {
          labels: ['0-99', '100-199', '200-299', '300-399', '400-499', '500-599', '600-699','700-799','800-899','900-above'],
          datasets: [
            {
              label: 'Sales',
              data: [],
              backgroundColor: 'rgba(0, 81, 255, 0.8)',
              borderWidth: 1,
            },
          ],
        };
        for(let i=0;i<res.data.length;i++){
          
          if(res.data[i]._id==900){
            barchartObj["900-above"]=res.data[i].count;
            arr[res.data[i]._id/100]=res.data[i].count
            continue;
          }
          arr[res.data[i]._id/100]=res.data[i].count
          barchartObj[String(res.data[i]._id)+"-"+String(res.data[i]._id+99)]=res.data[i].count
        }
        setBarchartData(barchartObj)
        barData.datasets[0].data=arr;
        setDataForBarPlot(barData)
        


      })
      .catch(e=>{
        console.log("error while getting barcharObj data",e)
      })

      await axios.get('http://localhost:3000/piechart',{
        params:{
          monthData:monthData
        }
      })
      .then((response)=>{
        console.log("response : ",response.data)
        setPieChartData(response.data)
      })
      .catch(e=>{
        console.log("error while getting piechart data",e)
      })
    }

    getData()

  },[month])


  return (
    <>
      <div className='text-red-500 text-3xl'>Hello Ayaj  </div>
      <div onClick={handleSubmit} className='h-48 bg-gray-300'> submit</div>
      
      
      <div className='mt-12 m-auto w-64 border border-green-300 '>
        <div className='w-28 m-auto'>

        <select value={month} onChange={(e)=>setMonth(e.target.value)} name="month" id="month" 
          className=' h-10 w-28   text-lg  '
        >
          <option value="jan">January</option>
          <option value="feb">February</option>
          <option value="mar">March</option>
          <option value="apr">April</option>
          <option value="may">may</option>
          <option value="jun">june</option>
          <option value="jul">july</option>
          <option value="aug">august</option>
          <option value="sep">september</option>
          <option value="oct">october</option>
          <option value="nov">novermber</option>
          <option value="dec">december</option>
        </select>
        </div>
        { statisticsData && (
         <div className='  p-4  bg-green-100 text-center'>  
              <div>Total Sale : {statisticsData["Amount"]}</div>
              <div>Total Sold item : {statisticsData["Sold"]}</div>
              <div>Total not sold item : {statisticsData["notSold"]}</div>
            </div>
        )}
      </div>

      <div className='w-64  border border-pink-300 bg-pink-100 m-auto my-12 text-center'>
        { barchartData && (
          <div>
            <div className='bg-white p-2 text-lg'> Bar Chart Data  </div>
            <div className='py-3'>
              {
                Object.entries(barchartData).map(([key, value]) => (
                  <div>{ `${key}:  ${value}`} </div>
                ))
              }
            </div>
            

          </div>
          
        )}
      </div>
      { dataForBarPlot && options && (
        <div className='px-auto'>
          <Bar data={dataForBarPlot} options={options} />
        </div>
      )}
      

      <div className='w-64  border border-blue-300 bg-blue-100 m-auto my-12 text-center'>
        { piechartData && (
          <div>
            <div className='bg-white p-2 text-lg'> Pie Chart Data  </div>

              <div className='py-3'>
              {
                piechartData.map((doc,key) => (
                  <div>{ `${doc._id}:  ${doc.count}`} </div>
                )) 
              }
              </div>

          </div>
        )}
      </div>
    </>
  )
}

export default App
