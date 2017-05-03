import googleTranslate from './googleTranslate';
import icibaTranslate from './icibaTranslate';
import {getSourceLanguageAC} from '../actionCreators';
import {POPENV, getUILanguage} from './tools';

function shouldUseIciba(option) {
	if((option.hl === 'zh-CN' || (option.hl === 'auto' && getUILanguage() === 'zh-CN')) && option.firstIciba) {
		if(POPENV) {
			if(~['auto', 'zh-CN', 'ko', 'ja', 'en', 'fr'].indexOf(option.from) && ~['auto', 'zh-CN'].indexOf(option.to)) {
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}
	return false;
}

function translate(option, dispatch, autoVoice) {
	return new Promise((reslove, reject) => {
		googleTranslate(option).then((response) => {
			getSourceLanguageAC(dispatch)(response, option.q, autoVoice);
			reslove(response);
		}).catch((error) => {
			reject(error);
		});
	});
}


export default translate;