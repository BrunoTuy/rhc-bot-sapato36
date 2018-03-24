const TelegramBot = require( 'node-telegram-bot-api' );
const cmds = require( './comandos' );
const config = require( './config.json' );

const bot = new TelegramBot( config.tokenBot, {polling: true});

const agruparLinhas = ( lista, linhas = 10 ) => {
	let retorno = [];
	let grupo = [];

	for ( let x = 0; x < lista.length; x++ ) {
		grupo.push( lista[x] );

		if ( grupo.length >= linhas || x+1 === lista.length ) {
			retorno.push( grupo.join( '\n' ) );

			grupo = [];
		}
	}

	return retorno;
}

const envio = ( chat, obj ) => {
	switch ( typeof obj ) {
		case 'string':
			envioString( chat, obj );
			break;

		case 'object':
			if ( obj.join ) {
				envioLista( chat, agruparLinhas( obj, 10 ) );
				break;
			}

		default:
			console.log( ' *** Não entendi o que devo enviar! *** ' );
			console.log( obj );
	}
};

const envioString = ( chat, texto ) => bot.sendMessage( chat, texto );
const envioLista = ( id, lista, idx ) => {
	if ( !idx ) {
		idx = 0;
	}

	if ( idx >= lista.length ) {
		return;
	}

	envioString( id, lista[idx] );

	setTimeout( () => envioLista( id, lista, ++idx ), 1000 );
};

bot.on( 'message', ( msg ) => {
	console.log( msg.message_id, ( msg.chat.type === 'private' ? 'PVT' : '' ), msg.chat.id, msg.from.username, msg.text );

	if ( !msg.text ) {
		return;
	}

	const parametros = msg.text.split( ' ' );
	const comando = parametros.shift().substring( 1 ).split( '@' )[0];

	if ( typeof cmds[comando] === 'undefined' || cmds[comando].exec  === 'undefined' ) {
		let resposta = `Oi @${msg.from.username}\nO comando digitado não foi reconhecido\n\nTente:\n`;

		for ( key in cmds ) {
			if ( cmds[key] ) {
				resposta += `/${key}\n`
			}
		}

		envio( msg.chat.id, resposta );
	}

	else {
		cmds[comando].exec({
			bot,
			config,
			parametros,
			original: msg,
			callback: ( resp ) => envio( msg.chat.id, resp )
		});
	}
});
