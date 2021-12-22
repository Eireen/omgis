import React from 'react';

export default class MainPage extends React.Component {
	render() {
		return (
			<div>
				<h1>Главная страница</h1>
				<ul>
				    <li><a href="/map">Карта</a></li>
				    <li><a href="/about">О сайте</a></li>
				</ul>
			</div>
		);
	}
}
