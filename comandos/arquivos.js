const fs = require("fs");
const http = require("https");
const pdfUtil = require("pdf-to-text");

const processarPDF = ( text ) => {
	const listaTransacoes = [];
	const todasLinhas = text.split( '\n' );

	for ( let x = 0; x < todasLinhas.length; x++ ) {
		const linha = todasLinhas[x];
		const transacao = {};

		if ( linha.substring( 2, 3 ) === '/' && linha.substring( 5, 6 ) === '/' ) {
			const dia = linha.substring( 0, 2 );
			const mes = linha.substring( 3, 5 );
			const ano = linha.substring( 6, 10 );
			const data = new Date( `${ano}-${mes}-${dia}` );

			const palavras = linha.split( ' ' ).filter( i => i !== '' );
			const dataString = palavras.shift();
			const operacao = palavras.pop();
			const valor = palavras.pop();
			const descricao = palavras.join( ' ' );

			transacao.data = data;
			transacao.valor = valor;
			transacao.negativo = ( operacao === '(-)' ? true : false );
			transacao.positivo = ( operacao === '(+)' ? true : false );

			if ( [ 'SALDO', 'Saldo Anterior' ].indexOf( descricao ) > -1 ) {
				transacao.saldo = true;
				transacao.descricao = descricao;
			}

			else {
				transacao.descricao = descricao;

				if ( x+1 < todasLinhas.length && todasLinhas[x+1].length > 5 ) {
					const segundaLinha = todasLinhas[x+1];
					const segundaPalavras = segundaLinha.split( ' ' ).filter( i => i !== '' );

					if ( segundaPalavras[0].indexOf( '/' ) !== 2 && isNaN( segundaPalavras[0] ) ) {
						transacao.descricao += ` - ${segundaPalavras.join( ' ' )}`;
					}

					else {
						const palavra01 = segundaPalavras.shift();
						const palavra02 = segundaPalavras.shift();

						if ( !isNaN( palavra01 ) ) {
							transacao.banco = palavra01;
						}

						else if ( palavra01.indexOf( '/' ) === 2 ) {
							const arrayData = palavra01.split( '/' );

							transacao.dataOperacao = new Date( `${transacao.data.getFullYear()}-${arrayData[1]-1}-${arrayData[0]}` );
						}

						if ( palavra02.indexOf( ':' ) > -1 ) {
							const hora = palavra02.split( ':' )[0];
							const minuto = palavra02.split( ':' )[1];

							transacao.dataOperacao.setHours( hora );
							transacao.dataOperacao.setMinutes( minuto );
						}

						else {
							const agencia = palavra02;
							const conta = segundaPalavras.shift();

							transacao.agencia = agencia;
							transacao.conta = conta;
						}

						const segundaDescricao = segundaPalavras.join( ' ' );

						transacao.descricao += ` - ${segundaDescricao}`;
					}
				}
			}

			listaTransacoes.push( transacao );
		}
	}

	return listaTransacoes;
};

const pdfToText = ({
	callback,
	parametros,
}) => {
	if ( parametros.length !== 1 ) {
		callback( 'Nenhum arquivo para converter.', true );

		return;
	}

	pdfUtil.pdfToText( parametros.shift().file_downloaded, {}, ( err, data ) => {
		if ( err ) {
			console.log( ' --- Erro processando PDF', err );
			callback( 'Não conseguimos processar o arquivo enviado.', true );

			return;
		}

		callback( data );
	});
};

const download = ({
	config,
	callback,
	parametros,
}) => {
	if ( parametros.length !== 1 ) {
		callback( 'Nenhum arquivo para download.' );

		return;
	}

	const informacoesArquivo = parametros.shift();
	const {
		file_id,
		file_path,
	} = informacoesArquivo;

	informacoesArquivo.file_downloaded = `./arquivos/${file_id}.pdf`;

	const file = fs.createWriteStream( informacoesArquivo.file_downloaded );

	const req = http.get( `https://api.telegram.org/file/bot${config.tokenBot}/${file_path}`, ( res ) => {
		res.pipe( file );

		callback( informacoesArquivo );
	});
}

const msg = ( opt ) => {
	if ( opt.parametros.length !== 1 ) {
		callback( 'Nenhum arquivo para processar.' );

		return;
	}

	console.log( ' --- informações recebidas na mensagem ', opt.parametros[0] );

	const informacoesArquivo = opt.parametros.shift();

	if ( informacoesArquivo.mime_type !== 'application/pdf' ) {
		opt.callback( 'Não processo esse tipo de arquivos.' );

		return;
	}

	download({
		...opt,
		comando: 'download',
		parametros: [ informacoesArquivo ],
		callback: ( resp, error ) => {
			if ( error ) {
				opt.callback( resp );

				return;
			}

			console.log( ' --- informações recebidas no apos download ', resp );

			pdfToText({
				...opt,
				comando: 'p2t',
				parametros: [ informacoesArquivo ],
				callback: ( resp, error ) => {
					if ( error ) {
						opt.callback( resp );

						return;
					}

					const processado = processarPDF( resp );

//					console.log( ' *** Extrato processado ', processado );

					opt.callback( JSON.stringify( processado ) );
				}
			});
		}
	})
};

module.exports = { 
	ocultar: true,
	exec: ( opt ) => {
		const {
			config,
			original,
			callback,
		} = opt;

		if ( config.adminChat !== original.chat.id ) {
			callback( 'Usuário sem permissão para acessar esse recurso.' );

			return;
		}

		switch ( opt.parametros.shift() ) {
			case 'download':
				download( opt );
				break;

			case 'p2t':
				pdfToText( opt );
				break;

			case 'msg':
				msg( opt );
				break;

			default:
				opt.callback( ' * Comando não encontrado!' );
		}
	}
};
