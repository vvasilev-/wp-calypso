/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { localize } from 'i18n-calypso';
import { identity } from 'lodash';

/**
 * Internal dependencies
 */
import StepWrapper from 'signup/step-wrapper';
import SignupActions from 'lib/signup/actions';
import analytics from 'lib/analytics';
import Card from 'components/card';

import BlogImage from '../design-type-with-store/blog-image';
import PageImage from '../design-type-with-store/page-image';
import GridImage from '../design-type-with-store/grid-image';

class DesignTypeStep extends Component {
	static propTypes = {
		translate: PropTypes.func
	};

	static defaultProps = {
		translate: identity
	};

	getChoices() {
		const { translate } = this.props;

		return [
			{ type: 'blog', label: translate( 'A list of my latest posts' ), image: <BlogImage /> },
			{ type: 'page', label: translate( 'A welcome page for my site' ), image: <PageImage /> },
			{ type: 'grid', label: translate( 'A grid of my latest posts' ), image: <GridImage /> },
		];
	}

	renderChoice = ( choice ) => {
		return (
			<Card className="design-type__choice" key={ choice.type }>
				<a className="design-type__choice-link" href="#" onClick={ ( event ) => this.handleChoiceClick( event, choice.type ) }>
					{ choice.image }
					<h2>{ choice.label }</h2>
				</a>
			</Card>
		);
	};

	renderChoices() {
		return (
			<div className="design-type__list">
				{ this.getChoices().map( this.renderChoice ) }
				<div className="design-type__choice is-spacergif" />
			</div>
		);
	}

	render() {
		return (
			<div className="design-type">
				<StepWrapper
					flowName={ this.props.flowName }
					stepName={ this.props.stepName }
					positionInFlow={ this.props.positionInFlow }
					fallbackHeaderText={ this.props.translate( 'What would you like your homepage to look like?' ) }
					fallbackSubHeaderText={ this.props.translate( 'This will help us figure out what kinds of designs to show you.' ) }
					signupProgressStore={ this.props.signupProgressStore }
					stepContent={ this.renderChoices() } />
			</div>
		);
	}

	handleChoiceClick( event, type ) {
		event.preventDefault();
		event.stopPropagation();
		this.handleNextStep( type );
	}

	handleNextStep( designType ) {
		analytics.tracks.recordEvent( 'calypso_triforce_select_design', { category: designType } );

		SignupActions.submitSignupStep( { stepName: this.props.stepName }, [], { designType } );
		this.props.goToNextStep();
	}
}

export default localize( DesignTypeStep );
