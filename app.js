let express = require("express");
let app = express();
let ejs = require("ejs");
const puppeteer = require('puppeteer');
const axios = require('axios');
const moment = require('moment');
require("dotenv").config();

app.get("/",async (req, res) => {
	res.send('Server Running Successfully');
});

app.get("/generatePDF",async (req, res) => {

	const apiUrl = 'https://api.usa.gov/crime/fbi/cde/arrest/state/AK/all';
	const apiKey = 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE77jo1RU8PIv';

	try {
		//calling the api
		const response = await axios.get(apiUrl, {
			params: {
				from: 2012,
				to: 2021,
				API_KEY: apiKey,
			},
		});

		//sending data as props
		const crimeData = response.data.data;
		const html = await ejs.renderFile('views/report-template.ejs', {crimeData, reportDate: moment(new Date()).format('LL')});

		const browser = await puppeteer.launch({
			args: [
				"--disable-setuid-sandbox",
				"--no-sandbox",
				"--single-process",
				"--no-zygote",
			],
			executablePath:
				process.env.NODE_ENV === "production"
					? process.env.PUPPETEER_EXECUTABLE_PATH
					: puppeteer.executablePath(),
		});
		const page = await browser.newPage();
		await page.setContent(html);

		// Generate the PDF
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true, // Include background colors and images
		});

		// Close the browser
		await browser.close();

		// // For saving to a file:
		// const fs = require('fs');
		// fs.writeFileSync('output.pdf', pdfBuffer);

		// For sending as a response (e.g., in a web application):
		res.contentType('application/pdf');
		res.send(pdfBuffer);

	} catch (error) {
		console.error('Error:', error);
		res.status(500).send({'Error fetching data from the API': error, message : error.message});
	}

});

app.listen(5000, () => {
	console.log('Server Is running At 5000');
});