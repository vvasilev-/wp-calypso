/**
* External dependencies
*/
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormSettingExplanation from 'components/forms/form-setting-explanation';
import FormSelect from 'components/forms/form-select';
import FormTextInput from 'components/forms/form-text-input';

const CommentDisplaySettings = ( { translate, onChangeField, submittingForm, fields } ) => {
	return (
		<FormFieldset className="comment-display-settings">
			<FormLabel htmlFor="highlander_comment_form_prompt">{ translate( 'Comments Label' ) }</FormLabel>
			<FormTextInput
				name="highlander_comment_form_prompt"
				type="text"
				id="highlander_comment_form_prompt"
				value={ fields.highlander_comment_form_prompt || '' }
				onChange={ onChangeField( 'highlander_comment_form_prompt' ) }
				disabled={ submittingForm } />
			<FormSettingExplanation>
				{ translate( 'A few catchy words to motivate your readers to comment.' ) }
			</FormSettingExplanation>
			<FormLabel htmlFor="jetpack_comment_form_color_scheme">{ translate( 'Color Scheme' ) }</FormLabel>
			<FormSelect
				name="jetpack_comment_form_color_scheme"
				value={ fields.jetpack_comment_form_color_scheme || 'light' }
				onChange={ onChangeField( 'jetpack_comment_form_color_scheme' ) }
				disabled={ submittingForm }>
				<option value="light">{ translate( 'Light' ) }</option>
				<option value="dark">{ translate( 'Dark' ) }</option>
				<option value="transparent">{ translate( 'Transparent' ) }</option>
			</FormSelect>
		</FormFieldset>
	);
};

export default localize( CommentDisplaySettings );
