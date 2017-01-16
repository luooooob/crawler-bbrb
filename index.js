import request from 'request'
import cheerio from 'cheerio' 
import iconv from 'iconv-lite'
import async from 'async'
import fs from 'fs'


class GaysDaily {constructor (GDtitle, author, pubDate, url) {
	this.GDtitle = GDtitle
	this.author  = author
	this.pubDate = pubDate
	this.url     = url
}}

// RequestOption with encoding: null
class RequestOption {constructor (url) {
	this.url = url
	this.encoding = null
}}

// global variable to save all info
var gaysDailys = new Array()

function requestGDUrls (callback) {
	var option = new RequestOption(
		'http://tieba.baidu.com/f/search/res?isnew=1&kw=%B1%CA%BC%C7%B1%BE&qw=%A1%BE%B1%CA%B0%C9%C8%D5%B1%A8%A1%BF&un=&rn=10&pn=0&sd=&ed=&sm=1&only_thread=1'
	)
	requestNextSearchPage(option, callback)
}

// 长一点的函数名比较有气势……
function requestNextSearchPage (option, callback) {
	request (option, (error, response, body) => {
		if (error) {
			console.log(option + error)
		} else {
			console.log('load... ' + option.url)
			// iconv-lite模块：gbk转码为utf-8
			body = iconv.decode(body, 'gbk').toString()
			var $ = cheerio.load(body)
			var GDtitle = $('.s_post .p_title a')
			for(let i = 0; i < GDtitle.length; i++) {
				// class GaysDaily: GDtitle, author, pubDate, url
				let gaysDaily = new GaysDaily(
					// GDtitle
					GDtitle.eq(i).text(),
					// author
					$('.s_post').children('a').eq(i*2 + 1).text(),
					// pubDate
					$('.s_post .p_date').eq(i).text(),
					// url
					'http://tieba.baidu.com' 
					+ $('.s_post .p_title a').eq(i).attr('href')
					.match(/.*(?=\&cid)/g)[0]
				)
				gaysDailys.push(gaysDaily)
			}
			var href = $('a.next').attr('href')
			// href = null;
			if (href) {
				option = new RequestOption('http://tieba.baidu.com' + href)
				requestNextSearchPage(option, callback)
			} else {
				callback()
			}
		}
	})
}


function asyncRequestGDInfo (callback) {
	async.mapLimit(gaysDailys, 30, (gaysDaily, callback) => {
		RequestAndSaveGDInfo(gaysDaily, callback)
	}, 
	(error,result) => {
		if(error) {
			console.log("async.mapLimit error"+ error);
		} else {
			callback()
		}
	})
}

function RequestAndSaveGDInfo(gaysDaily, callback) {
	request (gaysDaily.url, (error, response, body) => {
		if (error) {
			console.log(gaysDaily.url + error)
		} else {
			var $ = cheerio.load(body)
			var replies = $('.l_reply_num span[class="red"]').html()
			gaysDaily.replies = replies
			console.log(gaysDaily)
			var text = gaysDaily.GDtitle + '\t' 
						 + gaysDaily.author + '\t'
						 + gaysDaily.pubDate + '\t'
						 + gaysDaily.replies + '\t'
						 + gaysDaily.url + '\n'
			fs.appendFile('gay\'s Daily.txt', text)
			callback()
		}
	})
}

async.series([
	(callback) => {requestGDUrls(callback)}, 
	(callback) => {asyncRequestGDInfo (callback)}
], 
(error, results) => {
	if(error) {
		console.log("async error" + error)
	} else {
		console.log('---结束---')
	}
})