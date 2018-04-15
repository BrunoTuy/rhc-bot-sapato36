const TelegramBot = require( 'node-telegram-bot-api' );
const cmds = require( './comandos' );
const config = require( './config.json' );

const bot = new TelegramBot( config.tokenBot, {polling: true});

const enviar = require( './lib/enviarMensagemBot.js' )( bot );

bot.on( 'message', ( msg ) => {
	console.log( msg.message_id, ( msg.chat.type === 'private' ? 'PVT' : 'GRP' ), msg.chat.id, msg.from.username, msg.text );

	let comando = false;
	let parametros = [];

	if ( msg.document ) {
		comando = 'arquivos';
		parametros.push( 'msg' );
		parametros.push( msg.document );
	}

	else if ( msg.text ) {
		parametros = msg.text.split( ' ' );
		comando = ( parametros.shift() || '' ).substring( 1 ).split( '@' )[0];

		if ( typeof cmds[comando] === 'undefined' || cmds[comando].exec  === 'undefined' ) {
			let resposta = `Oi @${msg.from.first_name}\nO comando digitado não foi reconhecido\n\nTente:\n`;

			for ( key in cmds ) {
				if ( cmds[key] && !cmds[key].ocultar ) {
					resposta += `/${key}\n`
				}
			}

			enviar( msg.chat.id, resposta );
		}
	}

	if ( comando && cmds[comando] && cmds[comando].exec ) {
		cmds[comando].exec({
			bot,
			config,
			comando,
			parametros,
			original: msg,
			callback: ( resp ) => enviar( msg.chat.id, resp )
		});
	}
});
