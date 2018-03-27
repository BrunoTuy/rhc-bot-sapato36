const executarComando = ({ original, callback }) => {
	const cmds = require( './' );
	let resposta = `Oi ${original.from.first_name}\nSou um bot feito para facilitar o acesso a agenda de eventos do Raul Hacker Club http://raulhc.cc/\n\nEsses são os comandos que entendo:\n`;

	for ( key in cmds ) {
		if ( cmds[key] && !cmds[key].ocultar ) {
			resposta += `/${key}\n`
		}
	}

	callback( resposta ) 
};

module.exports = {
	ocultar: true,
	exec: executarComando
};
