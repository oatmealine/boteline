import * as CommandSystem from 'cumsystem';
import * as util from '../lib/util';
import * as minesweeper from 'minesweeper';

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand('fun', new CommandSystem.SimpleCommand('minesweeper', (msg) => {
		const params = util.getParams(msg);
		const board = new minesweeper.Board(minesweeper.generateMineArray({
			rows: Math.min(100, Number(params[0])),
			cols: Math.min(100, Number(params[1])),
			mines: params[2]
		}));

		let gridstring = '||' + board.grid()
			.map(ar => ar.map(t => 
				t.isMine ? ':bomb:' : `:${util.decimalToNumber(t.numAdjacentMines)}:`.replace(':zero:', ':white_large_square:')
			).join('||||')
			).join('||\n||') + '||';

		if (gridstring.length >= 2000) {
			return 'The grid is too large to put in a 2000 char message!';
		}

		return gridstring;
	})
		.addAlias('msw')
		.addExample('10 10 6')
		.setUsage('(number) (number) (number)')
		.setDisplayUsage('(width) (height) (mines)')
		.setDescription('play minesweeper with discord spoilers'));

}