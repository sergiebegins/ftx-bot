require("dotenv").config();
const ftx_rest= require("./ekler/ftx-rest");
const mail = require("./ekler/mail");

const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: '********************',
    APISECRET: '****************'
});
var beep = require('beepbeep')

let oynanan = [];

var coins = [
    'ADA','1INCH','AAVE','ALGO','ALPHA','ALT','AMPL','AR','ATOM','AVAX','BADGER','BAND','BAO','BAT','BCH','BNB',
    'BNT','BRZ','BSV','BTC','BTMX','BTT','CAKE','CHZ','COMP','CREAM','CRO','CRV','DASH','DEFI','DMG','DOT','DRGN',
    'EGLD','ENJ','EOS','ETH','EXCH','FIDA','FIL','FLM','FLOW','FTM','FTT','GRT','HNT','HOLY','HOT','HT','KAVA',
    'KIN','KNC','KSM','LEO','LINA','LINK','LRC','LTC','LUNA','MAPS','MATIC','MID','MKR','MTA','NEAR','NEO','NPXS',
    'OKB','OMG','ONT','OXY','PAXG','PERP','PRIV','QTUM','RAY','REEF','REN','ROOK','RSR','RUNE','SAND','SC','SHIT',
    'SNX','SOL','SRM','SUSHI','SXP','THETA','TOMO','TRU','TRX','TRYB','UNI','UNISWAP','VET','WAVES','XAUT','XLM',
    'XMR','XRP','XTZ','ZEC','ZIL','ZRX'
];


setInterval(function () {

    (async () => {



        let da = await binance.futuresDaily();

        let pr = new Promise( (resolve, reject) => {
        });
        let lowCount =0;
        let highCount =0;
        let minCount = 0;
        let yuzdeArr = [];
        let info = [];


        for(k in da){
            let cname = (da[k].symbol).replace("USDT", "");
            let r= coins.includes(cname);
            if(r){
                let yuzde = (100-da[k].lowPrice*100/da[k].lastPrice).toFixed(3);
                let yuzde2 = (da[k].highPrice*100/da[k].lastPrice-100).toFixed(3);

                // yuzdeArr.push(yuzde);
                // info.push(yuzde+'-'+cname+'-'+yuzde+'-'+yuzde2)

                if(yuzde2>yuzde){highCount++}else{lowCount++}

                if(da[k].symbol == 'BTCUSDT'){
                    if(yuzde<1 && yuzde2<1){
                        btc=0;
                    }else{
                        btc = 1;
                    }

                }
            }


        }

        // for(k in info){
        //     if(info[k].indexOf(Math.min.apply(Math, yuzdeArr))>-1 ){
        //         console.log('\n',info[k].split('-')[1],info[k].split('-')[2],lowCount,highCount,btc,info[k].split('-')[3])
        //     // oyna(info[k].split('-')[1],info[k].split('-')[2],lowCount,highCount,btc,info[k].split('-')[3])
        //     }
        // }


            console.log('y:'+highCount,'d:'+lowCount,'\n');
        for(k in da){
            let cname = (da[k].symbol).replace("USDT", "");
            let r= coins.includes(cname);

            if(r){

                let yuzde = (100-da[k].lowPrice*100/da[k].lastPrice).toFixed(3);
                let yuzde2 = (da[k].highPrice*100/da[k].lastPrice-100).toFixed(3);
                if(2>da[k].lastPrice){
                    dibFiyatUstu = (da[k].lowPrice/1000)*1001;
                }else {
                    dibFiyatUstu = (da[k].lowPrice/1000)*1005;
                }


                if(da[k].lastPrice<dibFiyatUstu){

                    ftx_rest.gecmis_getir( {
                        market_name:cname,
                        resolution: 86400,
                        limit:35,
                        ne_zamandan_itibaren: (60 * 60 * 24* 1), // 24 saat
                        aralik:"gunluk"
                    } ).then(r=>{
                        console.log( {r} );
                    });

                    console.log('\n',cname,yuzde,lowCount,highCount,btc,yuzde2)
                    oyna(cname,yuzde,lowCount,highCount,btc,yuzde2);
                }


            }


        }


    })();

},10000)


oyna = async (cname,yuzde,lowCount,highCount,btc,yuzde2) =>{
    let arr = [];
    let i = await ftx_rest.any_proces_control_status(cname+'-PERP');
    console.log(lowCount,yuzde,btc,i,yuzde2,cname)
    if(i<1){
        if(lowCount>20 && highCount>20 ){
            if(btc){
                if(yuzde2>3){
                    if(!oynanan.includes(cname)){
                        while_process_false(10,1,2,'LONG',cname+'-PERP');
                        arr.push([yuzde,cname,'l']);
                        oynanan.push(cname)
                        beep();
                    }

                }
            }
        }

    }
    console.log(arr);
}

while_process_false = (miktar,lyuzde,syuzde,tip,para) => {
    //Just no process. We should get price
    process.argv[6] = miktar;
    process.argv[4] = lyuzde;
    process.argv[5] = syuzde;
    process.argv[2] = tip;
    process.argv[3] = para;
    data = {};

    ftx_rest.get_price().then( price => {
        data["price"] = price;
        if ( process.argv[2] == "LONG" ){
            data["peak_point"] = price+((price/100)*parseFloat(process.argv[6]));
            console.log( data );
            ftx_rest.buy( process.argv[6], data["peak_point"].toFixed(6), "buy", false).then(bought => {
                setTimeout(() => {
                    data["process_id"] = bought.id;
                    ftx_rest.get_process(data["process_id"]).then(get_process => {
                        data["process_size"] = get_process.size;
                        data["process_price"] = get_process.avgFillPrice;
                        data["process_top_price"] = get_process.avgFillPrice+((get_process.avgFillPrice/100)*(process.argv[4]));
                        data["process_bottom_price"] = get_process.avgFillPrice-((get_process.avgFillPrice/100)*(process.argv[5]));
                                                
                        ftx_rest.sell( data["process_size"], data["process_top_price"].toFixed(6), "sell", true ).then(sell=>{
                            ftx_rest.stop( data["process_size"], data["process_bottom_price"].toFixed(6), "sell", true ).then(stop=>{
                                console.log( {stop} );
                            });
                        });               
                    });
                },5000);
            });
        }
        else if (  process.argv[2] == "SHORT" ){
            console.log("Short pozisyon açılıyor.. ");
            data["peak_point"] = price-((price/100)*parseFloat(process.argv[6]));
            console.log( {peak_point: data["peak_point"] } );
            

            
            let alinan_coin_adedi = ftx_rest.dolar_getir( process.argv[6], data["peak_point"].toFixed(6));
            ftx_rest.short_sell(process.argv[6], data["peak_point"].toFixed(6), "sell", false).then(selled => {
                
                setTimeout(() => {
                    data["process_id"] = selled.result.id;
                    console.log( {selled} );
                        data["process_size"] = selled.result.size;
                        data["process_price"] = data["price"];
                        data["process_top_price"] = data["process_price"]+((data["process_price"]/100)*(process.argv[4]));
                        data["process_bottom_price"] = data["process_price"]-((data["process_price"]/100)*(process.argv[5]));

                        console.log( {data} );
                                 
                        
                        ftx_rest.buy( data["process_size"], data["process_bottom_price"].toFixed(6), "buy", true ).then(sell=>{
                            console.log("Short buy:");
                            ftx_rest.stop( data["process_size"], data["process_top_price"].toFixed(6), "buy", true ).then(stop=>{
                                console.log("Short buy:");
                                console.log( {stop} );
                            });
                        });
                                     
                },5000);
                
                
            });
            
        } 
    })
}


