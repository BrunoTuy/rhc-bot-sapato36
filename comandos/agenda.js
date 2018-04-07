const request = require( 'request' );

const getData = ( tipo ) => {
	const data = new Date();

	switch ( tipo ) {
		case 'ano':
			return `${data.getFullYear()}-01-01`;

		case 'mes':
			return `${data.getFullYear()}-${data.getMonth() < 8 ? '0' : ''}${data.getMonth()+1}-01`;

		default:
			return `${data.getFullYear()}-${data.getMonth() < 8 ? '0' : ''}${data.getMonth()+1}-${data.getDate() < 10 ? '0' : ''}${data.getDate()}`;
	}
};

const buscarAgenda = ( dataInicial, onOK, onErro ) => request({
	method: 'GET',
	url: `http://raulhc.cc/Agenda/JSON?data=${dataInicial}`,
	headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/64.0.3282.167 Chrome/64.0.3282.167 Safari/537.36' },
	json: { nome: 'Bruno' }
}, ( error, response, body ) => {
	if ( error || !body || !body.eventos ) {
		onErro( 'Lista não encontrada.' );
	}

	else {
		onOK( body.eventos );
	}
});

const executarComando = ({
	comando,
	callback,
	parametros,
}) => {
	if ( parametros.length === 0 ) {
		parametros.push( 'proximos' );
	}

	if ( [ 'proximos', 'mes', 'ano' ].indexOf( parametros[0] ) < 0 ) {
		callback( `Comandos que são entendidos.\n\n /${comando} - vou te listar os proximos eventos \n /${comando} mes - vou te listar os eventos deste mês \n /${comando} ano - vou te listar os eventos deste ano` );
	}

	else {
		const data = getData( parametros[0] );
		const onError = () => callback( 'Erro conectando com a agenda, tente novamente mais tarde!' );
		const onOk = ( lista ) => {
			if ( lista.length === 0 ) {
				callback( `Nenhum evento a partir de ${data}` );
			}

			else {
				const linhas = lista.map( evt => `${evt.dataIni} as ${evt.horaIni} - ${evt.title}` );

				callback( linhas.concat( `\n${lista.length} eventos encontrados a partir de ${data}` ) );
			}
		}

		buscarAgenda( data, onOk, onError );
	}
};

module.exports = {
	alias: [ 'eventos' ],
	exec: executarComando
};
