const executarComando = ({ parametros, callback, config, bot, original }) => {
	if ( parametros.length === 0 ) {
		callback( 'Para o envio de sugestoes coloque sua mensagem logo apos o comando\n\nExemplo:\n/sugestao Melhore a funcionalidade xpto...' );
	}

	else {
		callback( 'Muito obrigado.\nA sugestão enviada com sucesso!' );

		const momento = new Date( original.date*1000 );
		const dadosChat = `${original.chat.type} ${(original.chat.title || original.chat.id)}`;
		const dadosUsuario = `${original.from.first_name} ${original.from.last_name} @${original.from.username} ${original.from.language_code}`;

		bot.sendMessage( config.adminChat, `${momento}\n${dadosUsuario}\n${dadosChat}\n${parametros.join( ' ' )}` );
	}
};

module.exports = { exec: executarComando };
